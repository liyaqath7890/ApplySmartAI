import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import EventBus from './EventBus.js';

/**
 * BullMQ Job Queue Service
 * Handles background job processing for job aggregation, notifications, etc.
 */
export class JobQueueService {
  constructor() {
    this.connection = null;
    this.queues = {};
    this.workers = {};
    this.queueEvents = {};
    this.initialized = false;
  }

  /**
   * Initialize Redis connection and queues
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.connection = new IORedis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null, // Required for BullMQ
        retryDelayOnFailover: 100,
        lazyConnect: true,          // Don't auto-connect until first command
        enableOfflineQueue: false,  // Don't queue commands when offline
        connectTimeout: 5000,
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts during initialisation
          if (times > 3) return null;
          return Math.min(times * 500, 2000);
        },
      });

      // Suppress unhandled error events (we handle them explicitly)
      this.connection.on('error', (err) => {
        logger.warn(`Redis connection error (queue service): ${err.message}`);
      });

      // Test connection
      await this.connection.connect();
      await this.connection.ping();
      logger.info('Redis connected for job queues');

      // Only initialise queues if Redis is available
      this.initializeQueues();
      
      // Initialize queue events
      this.initializeQueueEvents();

      this.initialized = true;
      logger.info('Job queue service initialized');
    } catch (error) {
      // Clean up the connection so it doesn't keep retrying
      if (this.connection) {
        this.connection.disconnect();
        this.connection = null;
      }
      logger.error(`Failed to initialize job queue service: ${error.message}`);
      logger.warn('Running without job queue - background jobs will be processed synchronously');
    }
  }

  /**
   * Initialize all queues
   */
  initializeQueues() {
    // Job aggregation queue
    this.queues.jobAggregation = new Queue('job-aggregation', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Notification queue
    this.queues.notifications = new Queue('notifications', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Email digest queue
    this.queues.emailDigests = new Queue('email-digests', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 50,
        attempts: 3
      }
    });

    // Resume processing queue
    this.queues.resumeProcessing = new Queue('resume-processing', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 2
      }
    });

    // AI analysis queue
    this.queues.aiAnalysis = new Queue('ai-analysis', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      }
    });

    // Job Search Agent queue
    this.queues.jobSearch = new Queue('job-search', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Resume Agent queue
    this.queues.resumeGeneration = new Queue('resume-generation', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      }
    });

    // Cover Letter Agent queue
    this.queues.coverLetterGeneration = new Queue('cover-letter-generation', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 8000
        }
      }
    });

    // Job Analysis Agent queue
    this.queues.jobAnalysis = new Queue('job-analysis', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Interview Agent queue
    this.queues.interviewPreparation = new Queue('interview-preparation', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      }
    });

    // Career Twin Agent queue
    this.queues.careerTwin = new Queue('career-twin', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 15000
        }
      }
    });

    // Learning Agent queue
    this.queues.learningPath = new Queue('learning-path', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 30,
        removeOnFail: 60,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 12000
        }
      }
    });

    // Recruiter Agent queue
    this.queues.recruiter = new Queue('recruiter', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 8000
        }
      }
    });

    // Opportunity Radar Agent queue
    this.queues.opportunityRadar = new Queue('opportunity-radar', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Application Workflow queue
    this.queues.applicationWorkflow = new Queue('application-workflow', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      }
    });

    // ATS Scoring queue
    this.queues.atsScoring = new Queue('ats-scoring', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Match Scoring queue
    this.queues.matchScoring = new Queue('match-scoring', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Skill Gap Analysis queue
    this.queues.skillGapAnalysis = new Queue('skill-gap-analysis', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 8000
        }
      }
    });

    // Career Prediction queue
    this.queues.careerPrediction = new Queue('career-prediction', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 15000
        }
      }
    });

    // Salary Prediction queue
    this.queues.salaryPrediction = new Queue('salary-prediction', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 8000
        }
      }
    });

    // Semantic Embeddings queue
    this.queues.semanticEmbeddings = new Queue('semantic-embeddings', {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    logger.info(`Initialized ${Object.keys(this.queues).length} job queues`);
  }

  /**
   * Initialize queue event listeners
   */
  initializeQueueEvents() {
    for (const [name, queue] of Object.entries(this.queues)) {
      this.queueEvents[name] = new QueueEvents(name, {
        connection: this.connection
      });

      this.queueEvents[name].on('completed', ({ jobId, returnvalue }) => {
        logger.info(`Job ${jobId} completed in queue ${name}`);
      });

      this.queueEvents[name].on('failed', ({ jobId, failedReason }) => {
        logger.error(`Job ${jobId} failed in queue ${name}: ${failedReason}`);
      });

      this.queueEvents[name].on('stalled', ({ jobId }) => {
        logger.warn(`Job ${jobId} stalled in queue ${name}`);
      });
    }
  }

  /**
   * Create workers for processing jobs
   */
  createWorkers(processors) {
    // Job aggregation worker
    if (processors.jobAggregation) {
      this.workers.jobAggregation = new Worker(
        'job-aggregation',
        processors.jobAggregation,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Notifications worker
    if (processors.notifications) {
      this.workers.notifications = new Worker(
        'notifications',
        processors.notifications,
        {
          connection: this.connection,
          concurrency: 5
        }
      );
    }

    // Email digests worker
    if (processors.emailDigests) {
      this.workers.emailDigests = new Worker(
        'email-digests',
        processors.emailDigests,
        {
          connection: this.connection,
          concurrency: 1
        }
      );
    }

    // Resume processing worker
    if (processors.resumeProcessing) {
      this.workers.resumeProcessing = new Worker(
        'resume-processing',
        processors.resumeProcessing,
        {
          connection: this.connection,
          concurrency: 3
        }
      );
    }

    // AI analysis worker
    if (processors.aiAnalysis) {
      this.workers.aiAnalysis = new Worker(
        'ai-analysis',
        processors.aiAnalysis,
        {
          connection: this.connection,
          concurrency: 1
        }
      );
    }

    // Job Search worker
    if (processors.jobSearch) {
      this.workers.jobSearch = new Worker(
        'job-search',
        processors.jobSearch,
        {
          connection: this.connection,
          concurrency: 3
        }
      );
    }

    // Resume Generation worker
    if (processors.resumeGeneration) {
      this.workers.resumeGeneration = new Worker(
        'resume-generation',
        processors.resumeGeneration,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Cover Letter Generation worker
    if (processors.coverLetterGeneration) {
      this.workers.coverLetterGeneration = new Worker(
        'cover-letter-generation',
        processors.coverLetterGeneration,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Job Analysis worker
    if (processors.jobAnalysis) {
      this.workers.jobAnalysis = new Worker(
        'job-analysis',
        processors.jobAnalysis,
        {
          connection: this.connection,
          concurrency: 3
        }
      );
    }

    // Interview Preparation worker
    if (processors.interviewPreparation) {
      this.workers.interviewPreparation = new Worker(
        'interview-preparation',
        processors.interviewPreparation,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Career Twin worker
    if (processors.careerTwin) {
      this.workers.careerTwin = new Worker(
        'career-twin',
        processors.careerTwin,
        {
          connection: this.connection,
          concurrency: 1
        }
      );
    }

    // Learning Path worker
    if (processors.learningPath) {
      this.workers.learningPath = new Worker(
        'learning-path',
        processors.learningPath,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Recruiter worker
    if (processors.recruiter) {
      this.workers.recruiter = new Worker(
        'recruiter',
        processors.recruiter,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Opportunity Radar worker
    if (processors.opportunityRadar) {
      this.workers.opportunityRadar = new Worker(
        'opportunity-radar',
        processors.opportunityRadar,
        {
          connection: this.connection,
          concurrency: 3
        }
      );
    }

    // Application Workflow worker
    if (processors.applicationWorkflow) {
      this.workers.applicationWorkflow = new Worker(
        'application-workflow',
        processors.applicationWorkflow,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // ATS Scoring worker
    if (processors.atsScoring) {
      this.workers.atsScoring = new Worker(
        'ats-scoring',
        processors.atsScoring,
        {
          connection: this.connection,
          concurrency: 3
        }
      );
    }

    // Match Scoring worker
    if (processors.matchScoring) {
      this.workers.matchScoring = new Worker(
        'match-scoring',
        processors.matchScoring,
        {
          connection: this.connection,
          concurrency: 3
        }
      );
    }

    // Skill Gap Analysis worker
    if (processors.skillGapAnalysis) {
      this.workers.skillGapAnalysis = new Worker(
        'skill-gap-analysis',
        processors.skillGapAnalysis,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Career Prediction worker
    if (processors.careerPrediction) {
      this.workers.careerPrediction = new Worker(
        'career-prediction',
        processors.careerPrediction,
        {
          connection: this.connection,
          concurrency: 1
        }
      );
    }

    // Salary Prediction worker
    if (processors.salaryPrediction) {
      this.workers.salaryPrediction = new Worker(
        'salary-prediction',
        processors.salaryPrediction,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    // Semantic Embeddings worker
    if (processors.semanticEmbeddings) {
      this.workers.semanticEmbeddings = new Worker(
        'semantic-embeddings',
        processors.semanticEmbeddings,
        {
          connection: this.connection,
          concurrency: 2
        }
      );
    }

    logger.info(`Created ${Object.keys(this.workers).length} workers`);
  }

  // ==================== Job Aggregation Methods ====================

  /**
   * Add job aggregation job to queue
   */
  async addJobAggregation(candidateId, searchParams = {}) {
    if (!this.initialized || !this.queues.jobAggregation) {
      // Fallback to direct processing
      logger.warn('Queue not available, processing job aggregation directly');
      return null;
    }

    const job = await this.queues.jobAggregation.add('aggregate-jobs', {
      candidateId,
      searchParams,
      timestamp: new Date().toISOString()
    }, {
      jobId: `agg-${candidateId}-${Date.now()}`,
      priority: searchParams.priority || 1
    });

    logger.info(`Job aggregation queued: ${job.id}`);
    return job;
  }

  // ==================== Notification Methods ====================

  /**
   * Add notification job to queue
   */
  async addNotification(userId, type, data) {
    if (!this.initialized || !this.queues.notifications) {
      return null;
    }

    const job = await this.queues.notifications.add('send-notification', {
      userId,
      type,
      data,
      timestamp: new Date().toISOString()
    });

    return job;
  }

  /**
   * Dispatch job alerts to all users following a company
   */
  async dispatchCompanyJobAlerts(company, jobs) {
    if (!this.initialized || !this.queues.notifications || !jobs || jobs.length === 0) {
      return null;
    }

    try {
      // Dynamic import to avoid circular dependency
      const { SavedCompany, CandidateProfile, User } = await import('../routes/models/index.js');
      
      const followers = await SavedCompany.findAll({
        where: { companyId: company.id, isFollowing: true },
        include: [{ 
          model: CandidateProfile, 
          as: 'candidateProfile',
          include: [{ model: User, as: 'user' }]
        }]
      });

      logger.info(`Dispatching company job alert for ${company.name} to ${followers.length} followers`);

      const jobsQueued = [];
      for (const follower of followers) {
        if (!follower.candidateProfile || !follower.candidateProfile.user) continue;
        
        // Check notification preferences if defined
        if (follower.notificationPreferences && follower.notificationPreferences.jobAlerts === false) {
          continue; // User opted out of job alerts for this company
        }

        const user = follower.candidateProfile.user;
        const job = await this.queues.notifications.add('send-notification', {
          userId: user.id,
          userEmail: user.email,
          type: 'company_job_alert',
          data: {
            company: company.toJSON ? company.toJSON() : company,
            jobs
          },
          timestamp: new Date().toISOString()
        });
        jobsQueued.push(job);
      }

      return jobsQueued;
    } catch (err) {
      logger.error(`Failed to dispatch company job alerts: ${err.message}`);
      return null;
    }
  }

  // ==================== Email Digest Methods ====================

  /**
   * Schedule daily digest
   */
  async scheduleDailyDigest(userId, userEmail, hour = 8) {
    if (!this.initialized || !this.queues.emailDigests) {
      return null;
    }

    // Calculate delay until next scheduled time
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, 0, 0, 0);
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime - now;

    const job = await this.queues.emailDigests.add('daily-digest', {
      userId,
      userEmail,
      type: 'daily'
    }, {
      delay,
      repeat: {
        cron: `0 ${hour} * * *` // Daily at specified hour
      },
      jobId: `daily-digest-${userId}`
    });

    return job;
  }

  /**
   * Schedule weekly summary
   */
  async scheduleWeeklySummary(userId, userEmail, dayOfWeek = 1, hour = 9) {
    if (!this.initialized || !this.queues.emailDigests) {
      return null;
    }

    const job = await this.queues.emailDigests.add('weekly-summary', {
      userId,
      userEmail,
      type: 'weekly'
    }, {
      repeat: {
        cron: `0 ${hour} * * ${dayOfWeek}` // Weekly on specified day
      },
      jobId: `weekly-summary-${userId}`
    });

    return job;
  }

  // ==================== Resume Processing Methods ====================

  /**
   * Add resume processing job
   */
  async addResumeProcessing(resumeId, userId, options = {}) {
    if (!this.initialized || !this.queues.resumeProcessing) {
      return null;
    }

    const job = await this.queues.resumeProcessing.add('process-resume', {
      resumeId,
      userId,
      options,
      timestamp: new Date().toISOString()
    }, {
      jobId: `resume-${resumeId}`
    });

    return job;
  }

  // ==================== AI Analysis Methods ====================

  /**
   * Add AI analysis job
   */
  async addAIAnalysis(type, data, priority = 'normal') {
    if (!this.initialized || !this.queues.aiAnalysis) {
      return null;
    }

    const job = await this.queues.aiAnalysis.add(`ai-${type}`, data, {
      priority: priority === 'high' ? 10 : priority === 'low' ? 1 : 5,
      attempts: 5
    });

    return job;
  }

  // ==================== Job Search Agent Methods ====================

  /**
   * Add job search job
   */
  async addJobSearch(candidateId, searchParams) {
    if (!this.initialized || !this.queues.jobSearch) {
      return null;
    }

    const job = await this.queues.jobSearch.add('search-jobs', {
      candidateId,
      searchParams,
      timestamp: new Date().toISOString()
    }, {
      jobId: `job-search-${candidateId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Resume Agent Methods ====================

  /**
   * Add resume generation job
   */
  async addResumeGeneration(candidateId, jobId, options = {}) {
    if (!this.initialized || !this.queues.resumeGeneration) {
      return null;
    }

    const job = await this.queues.resumeGeneration.add('generate-resume', {
      candidateId,
      jobId,
      options,
      timestamp: new Date().toISOString()
    }, {
      jobId: `resume-gen-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Cover Letter Agent Methods ====================

  /**
   * Add cover letter generation job
   */
  async addCoverLetterGeneration(candidateId, jobId, options = {}) {
    if (!this.initialized || !this.queues.coverLetterGeneration) {
      return null;
    }

    const job = await this.queues.coverLetterGeneration.add('generate-cover-letter', {
      candidateId,
      jobId,
      options,
      timestamp: new Date().toISOString()
    }, {
      jobId: `cover-letter-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Job Analysis Agent Methods ====================

  /**
   * Add job analysis job
   */
  async addJobAnalysis(candidateId, jobId) {
    if (!this.initialized || !this.queues.jobAnalysis) {
      return null;
    }

    const job = await this.queues.jobAnalysis.add('analyze-job', {
      candidateId,
      jobId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `job-analysis-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Interview Agent Methods ====================

  /**
   * Add interview preparation job
   */
  async addInterviewPreparation(candidateId, jobId, interviewId) {
    if (!this.initialized || !this.queues.interviewPreparation) {
      return null;
    }

    const job = await this.queues.interviewPreparation.add('prepare-interview', {
      candidateId,
      jobId,
      interviewId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `interview-prep-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Career Twin Agent Methods ====================

  /**
   * Add career twin generation job
   */
  async addCareerTwin(candidateId) {
    if (!this.initialized || !this.queues.careerTwin) {
      return null;
    }

    const job = await this.queues.careerTwin.add('generate-career-twin', {
      candidateId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `career-twin-${candidateId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Learning Agent Methods ====================

  /**
   * Add learning path generation job
   */
  async addLearningPath(candidateId, targetRole, skillGaps = []) {
    if (!this.initialized || !this.queues.learningPath) {
      return null;
    }

    const job = await this.queues.learningPath.add('generate-learning-path', {
      candidateId,
      targetRole,
      skillGaps,
      timestamp: new Date().toISOString()
    }, {
      jobId: `learning-path-${candidateId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Recruiter Agent Methods ====================

  /**
   * Add recruiter analysis job
   */
  async addRecruiterAnalysis(candidateId, recruiterId) {
    if (!this.initialized || !this.queues.recruiter) {
      return null;
    }

    const job = await this.queues.recruiter.add('analyze-recruiter', {
      candidateId,
      recruiterId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `recruiter-${candidateId}-${recruiterId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Opportunity Radar Agent Methods ====================

  /**
   * Add opportunity radar scan job
   */
  async addOpportunityRadarScan(candidateId, preferences = {}) {
    if (!this.initialized || !this.queues.opportunityRadar) {
      return null;
    }

    const job = await this.queues.opportunityRadar.add('scan-opportunities', {
      candidateId,
      preferences,
      timestamp: new Date().toISOString()
    }, {
      jobId: `opportunity-radar-${candidateId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Application Workflow Methods ====================

  /**
   * Add application workflow job
   */
  async addApplicationWorkflow(candidateId, jobId, workflowSteps = []) {
    if (!this.initialized || !this.queues.applicationWorkflow) {
      return null;
    }

    const job = await this.queues.applicationWorkflow.add('process-application', {
      candidateId,
      jobId,
      workflowSteps,
      timestamp: new Date().toISOString()
    }, {
      jobId: `app-workflow-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== ATS Scoring Methods ====================

  /**
   * Add ATS scoring job
   */
  async addATSScoring(resumeId, jobId) {
    if (!this.initialized || !this.queues.atsScoring) {
      return null;
    }

    const job = await this.queues.atsScoring.add('score-ats', {
      resumeId,
      jobId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `ats-score-${resumeId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Match Scoring Methods ====================

  /**
   * Add match scoring job
   */
  async addMatchScoring(candidateId, jobId) {
    if (!this.initialized || !this.queues.matchScoring) {
      return null;
    }

    const job = await this.queues.matchScoring.add('score-match', {
      candidateId,
      jobId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `match-score-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Skill Gap Analysis Methods ====================

  /**
   * Add skill gap analysis job
   */
  async addSkillGapAnalysis(candidateId, jobId) {
    if (!this.initialized || !this.queues.skillGapAnalysis) {
      return null;
    }

    const job = await this.queues.skillGapAnalysis.add('analyze-skill-gap', {
      candidateId,
      jobId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `skill-gap-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Career Prediction Methods ====================

  /**
   * Add career prediction job
   */
  async addCareerPrediction(candidateId) {
    if (!this.initialized || !this.queues.careerPrediction) {
      return null;
    }

    const job = await this.queues.careerPrediction.add('predict-career', {
      candidateId,
      timestamp: new Date().toISOString()
    }, {
      jobId: `career-pred-${candidateId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Salary Prediction Methods ====================

  /**
   * Add salary prediction job
   */
  async addSalaryPrediction(candidateId, jobId, experienceLevel) {
    if (!this.initialized || !this.queues.salaryPrediction) {
      return null;
    }

    const job = await this.queues.salaryPrediction.add('predict-salary', {
      candidateId,
      jobId,
      experienceLevel,
      timestamp: new Date().toISOString()
    }, {
      jobId: `salary-pred-${candidateId}-${jobId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Semantic Embeddings Methods ====================

  /**
   * Add semantic embedding generation job
   */
  async addSemanticEmbedding(type, entityId, content) {
    if (!this.initialized || !this.queues.semanticEmbeddings) {
      return null;
    }

    const job = await this.queues.semanticEmbeddings.add('generate-embedding', {
      type,
      entityId,
      content,
      timestamp: new Date().toISOString()
    }, {
      jobId: `embedding-${type}-${entityId}-${Date.now()}`
    });

    return job;
  }

  // ==================== Queue Management Methods ====================

  /**
   * Get queue stats
   */
  async getQueueStats() {
    if (!this.initialized) {
      return { initialized: false };
    }

    const stats = {};
    for (const [name, queue] of Object.entries(this.queues)) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount()
      ]);

      stats[name] = {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed
      };
    }

    return { initialized: true, queues: stats };
  }

  /**
   * Clean up old jobs
   */
  async cleanup(maxAge = 24 * 60 * 60 * 1000) { // Default 24 hours
    if (!this.initialized) return;

    for (const queue of Object.values(this.queues)) {
      await queue.clean(maxAge, 'completed');
      await queue.clean(maxAge, 'failed');
    }

    logger.info('Cleaned up old jobs from queues');
  }

  /**
   * Drain all queues (for testing/maintenance)
   */
  async drain() {
    if (!this.initialized) return;

    for (const [name, queue] of Object.entries(this.queues)) {
      await queue.obliterate({ force: true });
      logger.info(`Drained queue: ${name}`);
    }
  }

  /**
   * Gracefully shutdown
   */
  async shutdown() {
    logger.info('Shutting down job queue service...');

    // Close all workers
    for (const [name, worker] of Object.entries(this.workers)) {
      await worker.close();
      logger.info(`Closed worker: ${name}`);
    }

    // Close all queue events
    for (const [name, events] of Object.entries(this.queueEvents)) {
      await events.close();
    }

    // Close all queues
    for (const [name, queue] of Object.entries(this.queues)) {
      await queue.close();
    }

    // Close Redis connection
    if (this.connection) {
      await this.connection.quit();
    }

    this.initialized = false;
    logger.info('Job queue service shut down');
  }

  /**
   * Check if queues are healthy
   */
  async isHealthy() {
    if (!this.initialized) return false;

    try {
      await this.connection.ping();
      return true;
    } catch {
      return false;
    }
  }
}

export default new JobQueueService();