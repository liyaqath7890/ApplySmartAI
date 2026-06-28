import jobAggregationService from '../services/jobAggregation/JobAggregationService.js';
import applicationOrchestratorService from '../services/ApplicationOrchestratorService.js';
import { ApplicationPackage, ExternalJob } from '../routes/models/index.js';

export const aggregateJobs = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const searchParams = req.query;

    const jobs = await jobAggregationService.aggregateJobs(candidateId, searchParams);

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error aggregating jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSupportedPlatforms = async (req, res) => {
  try {
    const platforms = jobAggregationService.getSupportedPlatforms();
    res.json({ success: true, platforms });
  } catch (error) {
    console.error('Error getting supported platforms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createApplicationPackage = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { externalJobId, jobId } = req.body;

    const appPackage = await applicationOrchestratorService.createApplicationPackage(candidateId, {
      externalJobId,
      jobId
    });

    res.json({ success: true, applicationPackage: appPackage });
  } catch (error) {
    console.error('Error creating application package:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getApplicationPackages = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { status } = req.query;

    const where = { candidateId };
    if (status) {
      where.status = status;
    }

    const packages = await ApplicationPackage.findAll({
      where,
      include: [
        { model: ExternalJob, as: 'externalJob' },
        { model: 'Job', as: 'job' },
        { model: 'Resume', as: 'resume' },
        { model: 'CoverLetter', as: 'coverLetter' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, applicationPackages: packages });
  } catch (error) {
    console.error('Error getting application packages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reviewApplicationPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    const appPackage = await applicationOrchestratorService.reviewApplicationPackage(
      id,
      action,
      userId
    );

    res.json({ success: true, applicationPackage: appPackage });
  } catch (error) {
    console.error('Error reviewing application package:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await applicationOrchestratorService.submitApplication(id);

    res.json({ success: true, application });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
