import JobDiscoveryService from '../services/jobDiscoveryService.js';
import { JobPlatformCredential } from '../routes/models/index.js';

const jobDiscoveryService = new JobDiscoveryService();

// Search jobs across platforms
export const searchJobs = async (req, res) => {
  try {
    const { platforms, filters } = req.body;
    const candidateId = req.user.id;

    const jobs = await jobDiscoveryService.searchJobs(
      candidateId,
      platforms || ['mock'],
      filters || {}
    );

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get saved jobs
export const getSavedJobs = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { platform, isExpired, limit } = req.query;

    const jobs = await jobDiscoveryService.getSavedJobs(candidateId, {
      platform,
      isExpired: isExpired === 'true',
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a specific job
export const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const job = await jobDiscoveryService.getJobById(id, candidateId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Platform credentials
export const getPlatformCredentials = async (req, res) => {
  try {
    const credentials = await JobPlatformCredential.findAll({
      where: { candidateId: req.user.id }
    });

    res.json({ success: true, credentials });
  } catch (error) {
    console.error('Get platform credentials error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addPlatformCredential = async (req, res) => {
  try {
    const credential = await JobPlatformCredential.create({
      candidateId: req.user.id,
      ...req.body
    });

    res.status(201).json({ success: true, credential });
  } catch (error) {
    console.error('Add platform credential error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePlatformCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const credential = await JobPlatformCredential.findOne({
      where: { id, candidateId: req.user.id }
    });

    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    await credential.update(req.body);
    res.json({ success: true, credential });
  } catch (error) {
    console.error('Update platform credential error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePlatformCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const credential = await JobPlatformCredential.findOne({
      where: { id, candidateId: req.user.id }
    });

    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    await credential.destroy();
    res.json({ success: true, message: 'Credential deleted' });
  } catch (error) {
    console.error('Delete platform credential error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
