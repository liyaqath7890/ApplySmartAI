import {
  AdzunaProvider, JSearchProvider, ArbeitnowProvider, RemoteOKProvider,
  RemotiveProvider, USAJobsProvider, WellfoundProvider, GreenhouseProvider, LeverProvider,
  AshbyProvider, RSSFeedProvider
} from './providers/index.js';
import { ExternalJob, User, CandidateProfile, Skill } from '../../routes/models/index.js';
import CandidateIntelligenceService from '../CandidateIntelligenceService.js';
import logger from '../../utils/logger.js';

/**
 * Enhanced Job Aggregation Service
 * Aggregates jobs from multiple sources with deduplication
 */
export class JobAggregationService {
  constructor() {
    this.providers = {
      // External Job APIs
      adzuna: new AdzunaProvider({}),
      jsearch: new JSearchProvider({}),
      arbeitnow: new ArbeitnowProvider({}),
      remoteok: new RemoteOKProvider({}),
      remotive: new RemotiveProvider({}),
      usajobs: new USAJobsProvider({}),
      wellfound: new WellfoundProvider({}),
      
      // Company Career Page Adapters
      greenhouse: new GreenhouseProvider({}),
      lever: new LeverProvider({}),
      ashby: new AshbyProvider({}),
      
      // RSS Feed Aggregator
      rss: new RSSFeedProvider({})
    };
    
    // Duplicate detection cache (URL hash -> job ID)
    this.seenJobs = new Map();
    this.seenJobsTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  /**
   * Aggregate jobs from all configured providers
   */
  async aggregateJobs(candidateId, searchParams = {}) {
    try {
      const candidate = await User.findByPk(candidateId, {
        include: [
          { model: CandidateProfile, as: 'candidateProfile' },
          { model: Skill, as: 'skills' }
        ]
      });

      const allJobs = [];
      const providersToUse = searchParams.providers || Object.keys(this.providers);
      const startTime = Date.now();

      logger.info(`Starting job aggregation for candidate ${candidateId}`);

      // Fetch jobs from each provider in parallel
      const providerPromises = providersToUse.map(async (providerName) => {
        try {
          const provider = this.providers[providerName];
          if (!provider.isConfigured()) {
            logger.warn(`Provider ${providerName} is not configured, skipping`);
            return [];
          }

          const rawJobs = await provider.fetchJobs(searchParams);
          const normalizedJobs = [];

          for (const rawJob of rawJobs) {
            try {
              const normalizedJob = provider.normalizeJob(rawJob);
              if (normalizedJob && provider.validateJob(normalizedJob)) {
                // Check for duplicates
                if (!this.isDuplicate(normalizedJob)) {
                  normalizedJobs.push({ ...normalizedJob, candidateId });
                  this.markAsSeen(normalizedJob);
                }
              }
            } catch (error) {
              logger.error(`Error normalizing job from ${providerName}: ${error.message}`);
            }
          }

          logger.info(`Provider ${providerName}: fetched ${rawJobs.length}, normalized ${normalizedJobs.length} jobs`);
          return normalizedJobs;
        } catch (error) {
          logger.error(`Error fetching jobs from ${providerName}: ${error.message}`);
          return [];
        }
      });

      const providerResults = await Promise.allSettled(providerPromises);
      
      for (const result of providerResults) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allJobs.push(...result.value);
        }
      }

      // Remove internal duplicates (same job from different providers)
      const uniqueJobs = this.deduplicateJobs(allJobs);
      
      // Save jobs to database
      const savedJobs = await this.saveJobs(uniqueJobs, candidate);
      
      const duration = Date.now() - startTime;
      logger.info(`Job aggregation completed: ${savedJobs.length} jobs saved in ${duration}ms`);

      return savedJobs;
    } catch (error) {
      logger.error(`Error aggregating jobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a job is a duplicate
   */
  isDuplicate(job) {
    // Generate a unique key based on job properties
    const key = this.generateJobHash(job);
    
    if (this.seenJobs.has(key)) {
      const seenAt = this.seenJobs.get(key);
      if (Date.now() - seenAt < this.seenJobsTTL) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Mark a job as seen
   */
  markAsSeen(job) {
    const key = this.generateJobHash(job);
    this.seenJobs.set(key, Date.now());
  }

  /**
   * Generate a hash for duplicate detection
   */
  generateJobHash(job) {
    // Use title + company + location as the primary key
    const normalizedTitle = (job.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedCompany = (job.company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedLocation = (job.location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    return `${normalizedTitle}-${normalizedCompany}-${normalizedLocation}`;
  }

  /**
   * Remove duplicates from a list of jobs
   */
  deduplicateJobs(jobs) {
    const seen = new Set();
    const uniqueJobs = [];

    for (const job of jobs) {
      const hash = this.generateJobHash(job);
      if (!seen.has(hash)) {
        seen.add(hash);
        uniqueJobs.push(job);
      }
    }

    return uniqueJobs;
  }

  /**
   * Save jobs to the database
   */
  async saveJobs(jobs, candidate) {
    const savedJobs = [];
    const batchSize = 10;

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (job) => {
        try {
          const [savedJob, created] = await ExternalJob.findOrCreate({
            where: {
              platform: job.platform,
              externalJobId: job.externalJobId
            },
            defaults: {
              candidateId: job.candidateId,
              ...job
            }
          });

          if (created && candidate) {
            try {
              const matchData = await CandidateIntelligenceService.matchCandidateToJob(
                job.candidateId, 
                savedJob.id, 
                true
              );
              
              await savedJob.update({
                matchScore: matchData.matchResponse?.matchPercentage || 0,
                missingSkills: matchData.matchResponse?.missingSkills || [],
                aiAnalysis: { 
                  explanation: matchData.matchResponse?.strengths,
                  matchDetails: matchData.matchResponse
                }
              });
            } catch (matchError) {
              logger.error(`Error calculating match score for job ${savedJob.id}: ${matchError.message}`);
            }
          }

          savedJobs.push(savedJob);
        } catch (error) {
          logger.error(`Error saving job: ${error.message}`);
        }
      });

      await Promise.allSettled(batchPromises);
    }

    return savedJobs;
  }

  /**
   * Get supported platforms
   */
  getSupportedPlatforms() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      id: key,
      name: provider.getPlatformName?.() || key,
      configured: provider.isConfigured(),
      type: this.getProviderType(key)
    }));
  }

  /**
   * Get provider type
   */
  getProviderType(providerName) {
    const apiProviders = ['adzuna', 'jsearch', 'arbeitnow', 'remoteok', 'remotive', 'usajobs', 'wellfound'];
    const careerPageProviders = ['greenhouse', 'lever', 'ashby'];
    const feedProviders = ['rss'];

    if (apiProviders.includes(providerName)) return 'api';
    if (careerPageProviders.includes(providerName)) return 'career-page';
    if (feedProviders.includes(providerName)) return 'rss';
    return 'unknown';
  }

  /**
   * Get a specific provider
   */
  getProvider(name) {
    return this.providers[name];
  }

  /**
   * Add a custom provider
   */
  addProvider(name, provider) {
    this.providers[name] = provider;
  }

  /**
   * Remove a provider
   */
  removeProvider(name) {
    delete this.providers[name];
  }

  /**
   * Clean up old entries from the seen jobs cache
   */
  cleanupSeenJobs() {
    const now = Date.now();
    for (const [key, timestamp] of this.seenJobs.entries()) {
      if (now - timestamp > this.seenJobsTTL) {
        this.seenJobs.delete(key);
      }
    }
  }

  /**
   * Get aggregation statistics
   */
  async getStats() {
    const stats = {
      totalExternalJobs: await ExternalJob.count(),
      jobsByPlatform: {},
      jobsByWorkType: {},
      averageMatchScore: 0
    };

    // Jobs by platform
    const platformCounts = await ExternalJob.findAll({
      attributes: ['platform', [ExternalJob.sequelize.fn('COUNT', ExternalJob.sequelize.col('platform')), 'count']],
      group: ['platform']
    });

    for (const pc of platformCounts) {
      stats.jobsByPlatform[pc.platform] = pc.dataValues.count;
    }

    // Jobs by work type
    const workTypeCounts = await ExternalJob.findAll({
      attributes: ['workType', [ExternalJob.sequelize.fn('COUNT', ExternalJob.sequelize.col('workType')), 'count']],
      group: ['workType']
    });

    for (const wc of workTypeCounts) {
      stats.jobsByWorkType[wc.workType || 'unspecified'] = wc.dataValues.count;
    }

    // Average match score
    const avgMatch = await ExternalJob.findAll({
      attributes: [[ExternalJob.sequelize.fn('AVG', ExternalJob.sequelize.col('matchScore')), 'avg']],
      raw: true
    });

    if (avgMatch.length > 0 && avgMatch[0].avg) {
      stats.averageMatchScore = parseFloat(avgMatch[0].avg).toFixed(2);
    }

    return stats;
  }
}

export default new JobAggregationService();