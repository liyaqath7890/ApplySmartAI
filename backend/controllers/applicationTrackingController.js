/**
 * Application Tracking Controller
 *
 * Manages the full lifecycle of applications INTERNALLY.
 * Does NOT submit to third-party platforms.
 *
 * Status flow:
 *   saved → applied → interview → offer → rejected | withdrawn
 *
 * Also handles:
 *   • ApplicationPackage status (draft → ready_for_review → approved → submitted)
 *   • Open official application URL (returns URL for the client to navigate to)
 *   • Internal status tracking with audit trail
 */

import { Application, ApplicationPackage, ExternalJob, Job, Resume, CoverLetter, Notification } from '../routes/models/index.js';
import StorageService from '../services/StorageService.js';
import AuditLogService from '../services/AuditLogService.js';
import NotificationService from '../services/NotificationService.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// ── Valid application status transitions ──────────────────────────────────────

const ALL_STAGES = [
  'imported', 'resume_generated', 'cover_letter_generated', 'ready_to_apply',
  'applied', 'assessment', 'interview_scheduled', 'interview_completed',
  'hr_round', 'technical_round', 'final_round', 'offer', 'rejected', 'withdrawn',
  // legacy support
  'pending', 'saved', 'viewed', 'shortlisted', 'interviewing', 'offered', 'accepted'
];

/**
 * Update application status with validation and audit logging.
 * POST /api/applications/:id/status
 */
export const updateStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const application = await Application.findOne({
    where: { id, candidateId: req.user.id },
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Validate status
  if (!ALL_STAGES.includes(status)) {
    return next(new AppError(`Invalid status: ${status}`, 400));
  }

  const previousStatus = application.status;
  const updateData = { status };

  if (notes) updateData.recruiterNotes = notes;

  // Set timestamp fields
  if (status === 'applied' && !application.appliedAt) updateData.appliedAt = new Date();
  if (status === 'viewed' && !application.viewedAt) updateData.viewedAt = new Date();
  if (['rejected', 'offer', 'offered'].includes(status) && !application.respondedAt) {
    updateData.respondedAt = new Date();
  }

  await application.update(updateData);

  // Audit log
  await AuditLogService.log({
    entityType:    'Application',
    entityId:      application.id,
    action:        `application.status.${status}`,
    userId:        req.user.id,
    previousState: { status: previousStatus },
    newState:      { status },
    ipAddress:     req.ip,
    userAgent:     req.headers['user-agent'],
  });

  // In-app notification
  await Notification.create({
    userId:   req.user.id,
    type:     'application_status',
    title:    `Application Status Updated: ${status}`,
    message:  `Your application status has been updated to "${status}".`,
    isRead:   false,
    data:     { applicationId: id, status, previousStatus },
  }).catch(() => {}); // Non-blocking

  logger.info(`Application ${id} status: ${previousStatus} → ${status} by user ${req.user.id}`);

  res.json({ success: true, data: application });
});

/**
 * Get the official application URL for an application package.
 * The client is responsible for opening this URL — we never auto-submit.
 * GET /api/application-packages/:id/apply-url
 */
export const getApplicationUrl = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const appPackage = await ApplicationPackage.findOne({
    where: { id, candidateId: req.user.id },
    include: [
      { model: ExternalJob, as: 'externalJob' },
      { model: Job,         as: 'job' },
    ],
  });

  if (!appPackage) {
    return next(new AppError('Application package not found', 404));
  }

  const job = appPackage.externalJob || appPackage.job;
  const applicationUrl = job?.jobUrl || job?.applyUrl;

  if (!applicationUrl) {
    return next(new AppError('No application URL found for this job', 404));
  }

  // Validate URL
  try {
    new URL(applicationUrl);
  } catch {
    return next(new AppError('Invalid application URL', 400));
  }

  // Log this access
  await AuditLogService.log({
    entityType: 'ApplicationPackage',
    entityId:   appPackage.id,
    action:     'application.url.accessed',
    userId:     req.user.id,
    metadata:   { applicationUrl },
  });

  res.json({
    success: true,
    applicationUrl,
    jobTitle:  job?.title,
    company:   job?.company,
    packageId: appPackage.id,
    message:   'Please open this URL to complete your application on the employer\'s website.',
  });
});

/**
 * Download application package files (resume + cover letter).
 * GET /api/application-packages/:id/download
 */
export const downloadPackageFiles = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const appPackage = await ApplicationPackage.findOne({
    where: { id, candidateId: req.user.id },
    include: [
      { model: Resume,      as: 'resume' },
      { model: CoverLetter, as: 'coverLetter' },
    ],
  });

  if (!appPackage) {
    return next(new AppError('Application package not found', 404));
  }

  const files = [];

  if (appPackage.resume?.fileUrl) {
    files.push({
      type:     'resume',
      fileName: appPackage.resume.fileName,
      url:      appPackage.resume.fileUrl,
    });
  }

  if (appPackage.coverLetter?.fileUrl) {
    files.push({
      type:     'cover_letter',
      fileName: `cover-letter-${appPackage.id}.pdf`,
      url:      appPackage.coverLetter.fileUrl,
    });
  }

  res.json({ success: true, files, packageId: id });
});

/**
 * Get application pipeline summary (Kanban-style).
 * GET /api/applications/pipeline
 */
export const getPipeline = catchAsync(async (req, res) => {
  const candidateId = req.user.id;

  const applications = await Application.findAll({
    where: { candidateId },
    include: [
      { model: ExternalJob, as: 'externalJob', attributes: ['title', 'company', 'jobUrl'] },
      { model: Job,         as: 'job',         attributes: ['title'] },
    ],
    order: [['appliedAt', 'DESC']],
  });

// Group by status
  const pipeline = {
    imported: [],
    resume_generated: [],
    cover_letter_generated: [],
    ready_to_apply: [],
    applied: [],
    assessment: [],
    interview_scheduled: [],
    interview_completed: [],
    hr_round: [],
    technical_round: [],
    final_round: [],
    offer: [],
    rejected: [],
    withdrawn: []
  };

  const normalizeStatus = (status) => {
    const s = status ? status.toLowerCase() : 'imported';
    if (s === 'pending' || s === 'saved' || s === 'viewed') return 'imported';
    if (s === 'shortlisted') return 'ready_to_apply';
    if (s === 'interviewing') return 'interview_scheduled';
    if (s === 'offered' || s === 'accepted') return 'offer';
    return s;
  };

  for (const app of applications) {
    const norm = normalizeStatus(app.status);
    const bucket = pipeline[norm] || pipeline.imported;
    bucket.push({
      id:        app.id,
      status:    norm,
      matchScore: app.matchScore,
      appliedAt: app.appliedAt,
      followUpDate: app.followUpDate,
      recruiter: app.recruiter,
      salary: app.salary,
      documentsUsed: app.documentsUsed,
      title:     app.externalJob?.title || app.job?.title || 'Unknown Position',
      company:   app.externalJob?.company || 'Unknown Company',
      jobUrl:    app.externalJob?.jobUrl,
    });
  }

  res.json({
    success: true,
    data: pipeline,
    counts: Object.fromEntries(Object.entries(pipeline).map(([k, v]) => [k, v.length])),
    total: applications.length,
  });
});

/**
 * Mark application package as saved (wishlist).
 * POST /api/applications/save
 */
export const saveJob = catchAsync(async (req, res, next) => {
  const { externalJobId, jobId } = req.body;
  const candidateId = req.user.id;

  if (!externalJobId && !jobId) {
    return next(new AppError('externalJobId or jobId is required', 400));
  }

  // Check if already saved
  const existing = await Application.findOne({
    where: {
      candidateId,
      ...(externalJobId ? { externalJobId } : { jobId }),
    },
  });

  if (existing) {
    return res.json({ success: true, data: existing, alreadySaved: true });
  }

  const application = await Application.create({
    candidateId,
    externalJobId: externalJobId || null,
    jobId:         jobId || null,
    status:        'imported',
    appliedAt:     new Date(),
  });

  res.status(201).json({ success: true, data: application });
});

/**
 * Update custom application tracking details
 * POST /api/applications/:id/track-details
 */
export const updateTrackingDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { appliedAt, followUpDate, notes, recruiter, salary, documentsUsed } = req.body;

  const application = await Application.findOne({
    where: { id, candidateId: req.user.id }
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  const updateData = {};
  if (appliedAt) updateData.appliedAt = new Date(appliedAt);
  if (followUpDate) updateData.followUpDate = new Date(followUpDate);
  if (notes !== undefined) updateData.recruiterNotes = notes;
  if (recruiter !== undefined) updateData.recruiter = recruiter;
  if (salary !== undefined) updateData.salary = salary;
  if (documentsUsed !== undefined) updateData.documentsUsed = documentsUsed;

  await application.update(updateData);

  res.status(200).json({
    success: true,
    message: 'Application tracking details updated successfully',
    data: application
  });
});
