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

    // 1. Fetch from live connectors if any match
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

    // Save connector jobs to database
    const savedConnectorJobs = [];
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
        savedConnectorJobs.push(savedJob);
      } catch (error) {
        console.error('Error saving job:', error);
      }
    }

    // 2. Fetch all matching jobs from the database (including background-synced jobs)
    const { Op } = await import('sequelize');
    const { JobAnalysisV2 } = await import('../routes/models/index.js');
    
    const dbWhere = {
      isExpired: false
    };

    if (filters.query) {
      dbWhere[Op.or] = [
        { title: { [Op.iLike]: `%${filters.query}%` } },
        { company: { [Op.iLike]: `%${filters.query}%` } },
        { description: { [Op.iLike]: `%${filters.query}%` } }
      ];
    }

    if (filters.location) {
      dbWhere.location = { [Op.iLike]: `%${filters.location}%` };
    }

    // Filter platforms if specified
    const targetPlatforms = (platforms || []).filter(p => p !== 'mock');
    if (targetPlatforms.length > 0) {
      dbWhere.platform = { [Op.in]: targetPlatforms };
    }

    const dbJobs = await ExternalJob.findAll({
      where: dbWhere,
      limit: 100
    });

    // Hydrate candidate-specific match analysis
    const hydratedJobs = [];
    for (const job of [...savedConnectorJobs, ...dbJobs]) {
      const jobJson = job.toJSON ? job.toJSON() : job;
      
      // Prevent duplicates in returned list
      if (hydratedJobs.some(hj => hj.platform === jobJson.platform && hj.externalJobId === jobJson.externalJobId)) {
        continue;
      }

      if (candidateId) {
        const analysis = await JobAnalysisV2.findOne({
          where: { candidateId, externalJobId: jobJson.id }
        });
        
        if (analysis) {
          jobJson.matchScore = analysis.matchScore;
          jobJson.missingSkills = analysis.missingSkills;
          jobJson.aiAnalysis = {
            ...jobJson.aiAnalysis,
            atsScore: analysis.matchScore, // Fallback if atsScore is matchScore
            explanation: analysis.strengths
          };
        }
      }
      
      hydratedJobs.push(jobJson);
    }

    return hydratedJobs;
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
