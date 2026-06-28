import {
  ApplicationPackage,
  User,
  CandidateProfile,
  Skill,
  ExternalJob,
  Job,
  Resume,
  ResumeVersion,
  CoverLetter,
  Notification,
  Application
} from '../routes/models/index.js';
import jobAggregationService from './jobAggregation/JobAggregationService.js';
import MultiResumeStrategyService from './MultiResumeStrategyService.js';
import CoverLetterService from './CoverLetterService.js';
import JobQueueService from './JobQueueService.js';
import MatchScoringService from './MatchScoringService.js';
import ATSScoringService from './ATSScoringService.js';
import SkillGapAnalysisService from './SkillGapAnalysisService.js';
import AuditLogService from './AuditLogService.js';
import EventBus from './EventBus.js';
import logger from '../utils/logger.js';

export class ApplicationOrchestratorService {
  async createApplicationPackage(candidateId, options) {
    try {
      const { externalJobId, jobId } = options;

      let job;
      if (externalJobId) {
        job = await ExternalJob.findByPk(externalJobId);
      } else if (jobId) {
        job = await Job.findByPk(jobId);
      }

      if (!job) {
        throw new Error('Job not found');
      }

      const candidate = await User.findByPk(candidateId, {
        include: [
          { model: CandidateProfile, as: 'candidateProfile' },
          { model: Skill, as: 'skills' }
        ]
      });

      const appPackage = await ApplicationPackage.create({
        candidateId,
        externalJobId,
        jobId,
        status: 'draft',
        matchScore: job.matchScore || 0,
        aiRecommendations: {}
      });

      // Generate tailored resume and cover letter
      const resume = await this.generateTailoredResume(candidate, job, appPackage.id);
      const coverLetter = await this.generateTailoredCoverLetter(candidate, job, appPackage.id);

      await appPackage.update({
        resumeId: resume?.id,
        coverLetterId: coverLetter?.id,
        status: 'ready_for_review'
      });

      // Send notification
      await Notification.create({
        userId: candidateId,
        type: 'job_match',
        title: 'New Application Ready for Review',
        message: `Application for ${job.title} at ${job.company} is ready for your review!`,
        isRead: false
      });

      return appPackage.reload({
        include: [
          { model: Job, as: 'job' },
          { model: ExternalJob, as: 'externalJob' },
          { model: Resume, as: 'resume' },
          { model: CoverLetter, as: 'coverLetter' }
        ]
      });
    } catch (error) {
      console.error('Error creating application package:', error);
      throw error;
    }
  }

  async generateTailoredResume(candidate, job, appPackageId) {
    try {
      const existingResume = await Resume.findOne({
        where: { candidateId: candidate.id, isPrimary: true }
      });

      if (!existingResume) {
        return null;
      }

      // Generate Tailored JSON via AI
      const tailoredData = await MultiResumeStrategyService.generateTailoredResume(
        candidate.candidateProfile,
        job,
        candidate.skills,
        candidate.workExperience,
        candidate.education,
        [] // projects omitted for brevity
      );

      const resumeVersion = await ResumeVersion.create({
        resumeId: existingResume.id,
        jobId: job.id || null,
        externalJobId: job.externalJobId || null,
        isAiGenerated: true,
        versionNumber: existingResume.versions ? existingResume.versions.length + 1 : 1,
        content: JSON.stringify(tailoredData)
      });

      return existingResume;
    } catch (error) {
      console.error('Error generating tailored resume:', error);
      return null;
    }
  }

  async generateTailoredCoverLetter(candidate, job, appPackageId) {
    try {
      const content = await CoverLetterService.generateCoverLetterContent(candidate.id, job, null, 'Professional');

      const coverLetter = await CoverLetter.create({
        candidateId: candidate.id,
        jobId: job.id || null,
        externalJobId: job.externalJobId || job.id || null, // ensure valid UUID
        title: `Cover Letter for ${job.title} at ${job.company}`,
        content,
        isAiGenerated: true,
        aiScore: 90
      });

      return coverLetter;
    } catch (error) {
      console.error('Error generating cover letter:', error);
      return null;
    }
  }

  async reviewApplicationPackage(packageId, action, userId) {
    const appPackage = await ApplicationPackage.findByPk(packageId);
    if (!appPackage) {
      throw new Error('Application package not found');
    }

    if (action === 'approve') {
      await appPackage.update({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: userId
      });
    } else if (action === 'reject') {
      await appPackage.update({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: userId
      });
    }

    return appPackage;
  }

  async submitApplication(packageId) {
    const appPackage = await ApplicationPackage.findByPk(packageId);
    if (!appPackage) {
      throw new Error('Application package not found');
    }

    if (appPackage.status !== 'approved') {
      throw new Error('Application must be approved before submitting');
    }

    // Create application record
    const application = await this.createApplicationFromPackage(appPackage);

    await appPackage.update({
      status: 'submitted',
      submittedAt: new Date()
    });

    return application;
  }

  async createApplicationFromPackage(appPackage) {
    // Create application record
    return await Application.create({
      candidateId: appPackage.candidateId,
      jobId: appPackage.jobId,
      externalJobId: appPackage.externalJobId,
      resumeId: appPackage.resumeId,
      coverLetterId: appPackage.coverLetterId,
      status: 'applied',
      appliedAt: new Date()
    });
  }

  // ==================== Complete Workflow Automation ====================

  /**
   * Execute complete application workflow
   * Search Jobs → Analyze Jobs → Calculate Match → Generate Resume → Generate Cover Letter → 
   * Create Application Package → Wait for User Approval → Submit → Track → Notify User
   */
  async executeCompleteWorkflow(candidateId, searchParams, options = {}) {
    const workflowId = `workflow-${candidateId}-${Date.now()}`;
    const { autoSubmit = false, waitForApproval = true } = options;

    try {
      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'start',
        userId: candidateId,
        inputData: { searchParams, options },
        status: 'success'
      });

      // Step 1: Search Jobs
      logger.info(`Step 1: Searching jobs for candidate ${candidateId}`);
      const searchResults = await this.searchJobs(candidateId, searchParams);
      
      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'search_jobs',
        userId: candidateId,
        inputData: searchParams,
        outputData: { jobCount: searchResults.length },
        status: 'success'
      });

      EventBus.emit('workflow-step-completed', { workflowId, step: 'search_jobs', results: searchResults });

      const workflowResults = {
        workflowId,
        candidateId,
        steps: [],
        jobs: []
      };

      // Process each job found
      for (const job of searchResults.slice(0, options.maxJobs || 5)) {
        const jobResult = await this.processJobForApplication(candidateId, job, workflowId, options);
        workflowResults.jobs.push(jobResult);
      }

      // Step 9: Notify User
      await this.notifyUserWorkflowComplete(candidateId, workflowResults);

      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'complete',
        userId: candidateId,
        outputData: workflowResults,
        status: 'success'
      });

      return workflowResults;
    } catch (error) {
      logger.error(`Workflow execution failed: ${error.message}`);
      
      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'error',
        userId: candidateId,
        errorMessage: error.message,
        status: 'failure'
      });

      throw error;
    }
  }

  /**
   * Process a single job through the application workflow
   */
  async processJobForApplication(candidateId, job, workflowId, options) {
    const jobResult = {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      steps: []
    };

    try {
      // Step 2: Analyze Job
      logger.info(`Step 2: Analyzing job ${job.id}`);
      const jobAnalysis = await this.analyzeJob(candidateId, job.id);
      jobResult.steps.push({ step: 'job_analysis', status: 'completed', data: jobAnalysis });

      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'analyze_job',
        userId: candidateId,
        inputData: { jobId: job.id },
        outputData: jobAnalysis,
        status: 'success'
      });

      // Step 3: Calculate Match
      logger.info(`Step 3: Calculating match for job ${job.id}`);
      const matchScore = await MatchScoringService.calculateMatch(candidateId, job.id);
      jobResult.steps.push({ step: 'match_scoring', status: 'completed', data: matchScore });

      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'calculate_match',
        userId: candidateId,
        inputData: { jobId: job.id },
        outputData: matchScore,
        status: 'success'
      });

      // Only proceed if match score is acceptable
      if (matchScore.overallScore < (options.minMatchScore || 50)) {
        jobResult.steps.push({ 
          step: 'workflow_decision', 
          status: 'skipped', 
          reason: 'Match score below threshold',
          matchScore: matchScore.overallScore 
        });
        return jobResult;
      }

      // Step 4: Generate Resume
      logger.info(`Step 4: Generating resume for job ${job.id}`);
      const resumeResult = await this.generateResumeForJob(candidateId, job.id);
      jobResult.steps.push({ step: 'resume_generation', status: 'completed', data: resumeResult });

      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'generate_resume',
        userId: candidateId,
        inputData: { jobId: job.id },
        outputData: resumeResult,
        status: 'success'
      });

      // Step 5: Generate Cover Letter
      logger.info(`Step 5: Generating cover letter for job ${job.id}`);
      const coverLetterResult = await this.generateCoverLetterForJob(candidateId, job.id);
      jobResult.steps.push({ step: 'cover_letter_generation', status: 'completed', data: coverLetterResult });

      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'generate_cover_letter',
        userId: candidateId,
        inputData: { jobId: job.id },
        outputData: coverLetterResult,
        status: 'success'
      });

      // Step 6: Create Application Package
      logger.info(`Step 6: Creating application package for job ${job.id}`);
      const appPackage = await this.createApplicationPackage(candidateId, {
        jobId: job.id,
        matchScore: matchScore.overallScore
      });
      jobResult.steps.push({ step: 'create_package', status: 'completed', data: appPackage });

      await AuditLogService.logWorkflowExecution({
        workflowType: 'application',
        workflowId,
        step: 'create_package',
        userId: candidateId,
        inputData: { jobId: job.id },
        outputData: { packageId: appPackage.id },
        status: 'success'
      });

      // Step 7: Wait for User Approval (if enabled)
      if (options.waitForApproval !== false) {
        logger.info(`Step 7: Waiting for user approval for job ${job.id}`);
        jobResult.steps.push({ 
          step: 'await_approval', 
          status: 'pending', 
          packageId: appPackage.id,
          message: 'Awaiting user approval'
        });

        // Emit event for UI to handle approval
        EventBus.emit('application-awaiting-approval', {
          workflowId,
          packageId: appPackage.id,
          jobId: job.id,
          candidateId
        });

        return jobResult;
      }

      // Step 8: Submit Application (if auto-submit enabled)
      if (options.autoSubmit) {
        logger.info(`Step 8: Auto-submitting application for job ${job.id}`);
        const submission = await this.submitApplication(appPackage.id);
        jobResult.steps.push({ step: 'submit', status: 'completed', data: submission });

        await AuditLogService.logWorkflowExecution({
          workflowType: 'application',
          workflowId,
          step: 'submit_application',
          userId: candidateId,
          inputData: { packageId: appPackage.id },
          outputData: submission,
          status: 'success'
        });

        // Step 9: Track Application
        logger.info(`Step 9: Setting up tracking for job ${job.id}`);
        await this.trackApplication(submission.id);
        jobResult.steps.push({ step: 'track', status: 'completed' });
      }

      return jobResult;
    } catch (error) {
      logger.error(`Error processing job ${job.id}: ${error.message}`);
      jobResult.steps.push({ step: 'error', status: 'failed', error: error.message });
      return jobResult;
    }
  }

  /**
   * Search jobs for candidate
   */
  async searchJobs(candidateId, searchParams) {
    try {
      // Add to queue for async processing
      const job = await JobQueueService.addJobSearch(candidateId, searchParams);
      
      if (job) {
        // Return immediately if queued
        return { queued: true, jobId: job.id };
      }

      // Fallback to direct processing
      const { Job } = await import('../routes/models/index.js');
      const { Sequelize } = await import('sequelize');
      
      let query = { where: { status: 'active' } };
      
      if (searchParams.keywords) {
        query.where[Sequelize.Op.or] = [
          { title: { [Sequelize.Op.iLike]: `%${searchParams.keywords}%` } },
          { description: { [Sequelize.Op.iLike]: `%${searchParams.keywords}%` } }
        ];
      }
      if (searchParams.location) {
        query.where.location = { [Sequelize.Op.iLike]: `%${searchParams.location}%` };
      }
      if (searchParams.remote !== undefined) {
        query.where.isRemote = searchParams.remote;
      }

      const jobs = await Job.findAll({
        ...query,
        limit: 50,
        order: [['createdAt', 'DESC']]
      });

      return jobs;
    } catch (error) {
      logger.error(`Job search error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze job
   */
  async analyzeJob(candidateId, jobId) {
    try {
      const job = await JobQueueService.addJobAnalysis(candidateId, jobId);
      
      if (job) {
        return { queued: true, jobId: job.id };
      }

      // Fallback to direct processing
      const JobAnalysisAgent = (await import('./agents/jobAnalysisAgent.js')).default;
      const agent = new JobAnalysisAgent();
      return await agent.execute(null, { jobId, candidateId });
    } catch (error) {
      logger.error(`Job analysis error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate resume for job
   */
  async generateResumeForJob(candidateId, jobId) {
    try {
      const job = await JobQueueService.addResumeGeneration(candidateId, jobId);
      
      if (job) {
        return { queued: true, jobId: job.id };
      }

      // Fallback to direct processing
      const ResumeAgent = (await import('./agents/resumeAgent.js')).default;
      const agent = new ResumeAgent();
      return await agent.execute(null, { jobId, candidateId });
    } catch (error) {
      logger.error(`Resume generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate cover letter for job
   */
  async generateCoverLetterForJob(candidateId, jobId) {
    try {
      const job = await JobQueueService.addCoverLetterGeneration(candidateId, jobId);
      
      if (job) {
        return { queued: true, jobId: job.id };
      }

      // Fallback to direct processing
      const CoverLetterAgent = (await import('./agents/coverLetterAgent.js')).default;
      const agent = new CoverLetterAgent();
      return await agent.execute(null, { jobId, candidateId });
    } catch (error) {
      logger.error(`Cover letter generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Track application status
   */
  async trackApplication(applicationId) {
    try {
      const application = await Application.findByPk(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Set up tracking via queue
      await JobQueueService.addNotification(application.candidateId, 'application_tracking', {
        applicationId,
        jobId: application.jobId,
        status: application.status
      });

      return { tracking: true, applicationId };
    } catch (error) {
      logger.error(`Application tracking error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notify user about workflow completion
   */
  async notifyUserWorkflowComplete(candidateId, workflowResults) {
    try {
      const completedJobs = workflowResults.jobs.filter(j => 
        j.steps.some(s => s.step === 'submit' && s.status === 'completed')
      ).length;

      const pendingJobs = workflowResults.jobs.filter(j => 
        j.steps.some(s => s.step === 'await_approval')
      ).length;

      await Notification.create({
        userId: candidateId,
        type: 'workflow_complete',
        title: 'Application Workflow Complete',
        message: `Workflow completed: ${completedJobs} applications submitted, ${pendingJobs} awaiting approval.`,
        isRead: false,
        metadata: workflowResults
      });

      // Emit event for real-time notification
      EventBus.emit('notification', {
        userId: candidateId,
        type: 'workflow_complete',
        data: workflowResults
      });
    } catch (error) {
      logger.error(`Notification error: ${error.message}`);
    }
  }

  /**
   * Resume workflow from approval step
   */
  async resumeWorkflowFromApproval(packageId, action, userId) {
    try {
      const appPackage = await ApplicationPackage.findByPk(packageId);
      if (!appPackage) {
        throw new Error('Application package not found');
      }

      if (action === 'approve') {
        await this.reviewApplicationPackage(packageId, 'approve', userId);
        const submission = await this.submitApplication(packageId);
        await this.trackApplication(submission.id);
        
        await Notification.create({
          userId: appPackage.candidateId,
          type: 'application_submitted',
          title: 'Application Submitted Successfully',
          message: `Your application has been submitted for ${appPackage.job?.title || 'the position'}.`,
          isRead: false
        });

        return { status: 'submitted', applicationId: submission.id };
      } else {
        await this.reviewApplicationPackage(packageId, 'reject', userId);
        
        await Notification.create({
          userId: appPackage.candidateId,
          type: 'application_rejected',
          title: 'Application Cancelled',
          message: 'The application has been cancelled based on your decision.',
          isRead: false
        });

        return { status: 'cancelled' };
      }
    } catch (error) {
      logger.error(`Workflow resume error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId) {
    try {
      const logs = await AuditLogService.getWorkflowTrail(workflowId);
      
      const steps = logs.map(log => ({
        step: log.action.split('.').pop(),
        status: log.status,
        timestamp: log.timestamp,
        metadata: log.metadata
      }));

      const completedSteps = steps.filter(s => s.status === 'success').length;
      const totalSteps = steps.length;

      return {
        workflowId,
        progress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        steps,
        status: steps[steps.length - 1]?.status || 'unknown'
      };
    } catch (error) {
      logger.error(`Workflow status error: ${error.message}`);
      throw error;
    }
  }
}

export default new ApplicationOrchestratorService();
