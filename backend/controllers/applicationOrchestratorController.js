import { Application, ApplicationPackage, Job, ExternalJob } from '../routes/models/index.js';
import ApplicationOrchestratorService from '../services/ApplicationOrchestratorService.js';

// @desc    Get all applications for a candidate
export const getApplications = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { status, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const where = { candidateId };
    if (status) where.status = status;

    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      include: [
        { model: Job, as: 'job' },
        { model: ExternalJob, as: 'externalJob' }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['appliedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Application Packages Queue
export const getApplicationQueue = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const packages = await ApplicationPackage.findAll({
      where: { candidateId },
      include: ['job', 'externalJob', 'resume', 'coverLetter'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Get application queue error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new Application Package for Review Queue
export const createApplicationPackage = async (req, res) => {
  try {
    const { jobId, externalJobId } = req.body;
    const candidateId = req.user.id;
    
    const appPackage = await ApplicationOrchestratorService.createApplicationPackage(candidateId, { jobId, externalJobId });

    res.status(201).json({ success: true, data: appPackage });
  } catch (error) {
    console.error('Create application package error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Review an Application Package
export const reviewApplicationPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.user.id;

    const appPackage = await ApplicationOrchestratorService.reviewApplicationPackage(id, action, userId);
    res.json({ success: true, data: appPackage });
  } catch (error) {
    console.error('Review application package error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Submit an Application Package
export const submitApplicationPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await ApplicationOrchestratorService.submitApplication(id);
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Submit application package error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update application status (For legacy or recruiter flows)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, recruiterNotes } = req.body;
    const application = await Application.findOne({
      where: { id, candidateId: req.user.id }
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const updateData = { status };
    if (recruiterNotes) updateData.recruiterNotes = recruiterNotes;
    
    if (status === 'viewed' && !application.viewedAt) updateData.viewedAt = new Date();
    if (status === 'shortlisted' || status === 'interviewing' || status === 'rejected' || status === 'offered') {
      if (!application.respondedAt) updateData.respondedAt = new Date();
    }

    await application.update(updateData);
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
