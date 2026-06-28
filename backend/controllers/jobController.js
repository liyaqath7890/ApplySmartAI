import { Job, Application, User, Skill, RecruiterProfile } from '../routes/models/index.js';
import { Op } from 'sequelize';
import { AppError, catchAsync } from '../middleware/errorHandler.js';

// @desc    Get all jobs with filtering, sorting, and pagination
// @route   GET /api/jobs
// @access  Public
export const getJobs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    location,
    type,
    minSalary,
    maxSalary,
    sortBy = 'createdAt',
    order = 'DESC',
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }

  if (location) {
    where.location = { [Op.iLike]: `%${location}%` };
  }

  if (type) {
    where.type = type;
  }

  const { count, rows: jobs } = await Job.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, order]],
    include: [
      {
        model: User,
        as: 'recruiter',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    data: jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
  });
});

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const job = await Job.findByPk(id, {
    include: [
      {
        model: User,
        as: 'recruiter',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Application,
        as: 'applications',
      },
    ],
  });

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Recruiter only)
export const createJob = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    requirements,
    location,
    type,
    salary,
    tags,
  } = req.body;

  // Check if user is a recruiter
  if (req.user.role !== 'recruiter') {
    return next(new AppError('Only recruiters can post jobs', 403));
  }

  const recruiterProfile = await RecruiterProfile.findOne({
    where: { userId: req.user.id },
  });

  if (!recruiterProfile) {
    return next(new AppError('Recruiter profile not found', 404));
  }

  const job = await Job.create({
    title,
    description,
    requirements,
    location,
    type,
    salary,
    tags,
    recruiterId: recruiterProfile.id,
  });

  res.status(201).json({
    success: true,
    data: job,
  });
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter only)
export const updateJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findByPk(id);

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  // Check if user owns this job
  if (job.recruiterId !== req.user.recruiterProfile?.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this job', 403));
  }

  await job.update(req.body);

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter only)
export const deleteJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findByPk(id);

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  // Check if user owns this job
  if (job.recruiterId !== req.user.recruiterProfile?.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this job', 403));
  }

  await job.destroy();

  res.status(200).json({
    success: true,
    message: 'Job deleted successfully',
  });
});

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Candidate only)
export const applyForJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { coverLetter, resumeId } = req.body;

  const job = await Job.findByPk(id);

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  // Check if already applied
  const existingApplication = await Application.findOne({
    where: {
      jobId: id,
      candidateId: req.user.id,
    },
  });

  if (existingApplication) {
    return next(new AppError('You have already applied for this job', 400));
  }

  const application = await Application.create({
    jobId: id,
    candidateId: req.user.id,
    coverLetter,
    resumeId,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    data: application,
  });
});