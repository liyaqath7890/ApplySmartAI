import { ExternalJob, JobPlatformCredential } from '../routes/models/index.js';

// Base class for job platform connectors
class BaseJobConnector {
  constructor(platformName) {
    this.platformName = platformName;
  }

  async searchJobs(filters) {
    throw new Error('searchJobs method must be implemented');
  }

  async applyToJob(jobId, applicationData) {
    throw new Error('applyToJob method must be implemented');
  }

  normalizeJob(job) {
    return job;
  }
}

// Mock connector for demonstration
class MockJobConnector extends BaseJobConnector {
  constructor() {
    super('mock');
  }

  async searchJobs(filters) {
    // Mock jobs data
    return [
      {
        externalJobId: 'mock-1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        description: 'We are looking for a senior software engineer...',
        requirements: ['JavaScript', 'React', 'Node.js'],
        salary: '120000-160000',
        employmentType: 'full-time',
        workType: 'remote',
        jobUrl: 'https://example.com/job/mock-1',
        postedDate: new Date()
      },
      {
        externalJobId: 'mock-2',
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        description: 'Join our team as a frontend developer...',
        requirements: ['React', 'TypeScript', 'CSS'],
        employmentType: 'full-time',
        workType: 'hybrid',
        jobUrl: 'https://example.com/job/mock-2',
        postedDate: new Date()
      }
    ].map(job => this.normalizeJob(job));
  }

  normalizeJob(job) {
    return {
      ...job,
      platform: this.platformName,
      freshnessScore: 100,
      isExpired: false,
      aiAnalysis: {}
    };
  }
}

// Job Discovery Service
class JobDiscoveryService {
  constructor() {
    this.connectors = new Map();
    this.registerConnector('mock', new MockJobConnector());
  }

  registerConnector(platformName, connector) {
    this.connectors.set(platformName, connector);
  }

  async searchJobs(candidateId, platforms, filters) {
    const allJobs = [];

    for (const platform of platforms) {
      const connector = this.connectors.get(platform);
      if (connector) {
        try {
          const jobs = await connector.searchJobs(filters);
          allJobs.push(...jobs);
        } catch (error) {
          console.error(`Error searching jobs on ${platform}:`, error);
        }
      }
    }

    // Save jobs to database
    const savedJobs = [];
    for (const job of allJobs) {
      try {
        const [savedJob] = await ExternalJob.findOrCreate({
          where: {
            platform: job.platform,
            externalJobId: job.externalJobId
          },
          defaults: {
            candidateId,
            ...job
          }
        });
        savedJobs.push(savedJob.toJSON());
      } catch (error) {
        console.error('Error saving job:', error);
      }
    }

    return savedJobs;
  }

  async getSavedJobs(candidateId, filters = {}) {
    const where = { candidateId };
    if (filters.platform) where.platform = filters.platform;
    if (filters.isExpired !== undefined) where.isExpired = filters.isExpired;

    return await ExternalJob.findAll({
      where,
      order: [['postedDate', 'DESC']],
      limit: filters.limit || 50
    });
  }

  async getJobById(id, candidateId) {
    return await ExternalJob.findOne({ where: { id, candidateId } });
  }
}

export default JobDiscoveryService;
