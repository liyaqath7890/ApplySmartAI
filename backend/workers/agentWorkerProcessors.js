import JobSearchAgent from '../services/agents/jobSearchAgent.js';
import ResumeAgent from '../services/agents/resumeAgent.js';
import CoverLetterAgent from '../services/agents/coverLetterAgent.js';
import JobAnalysisAgent from '../services/agents/jobAnalysisAgent.js';
import InterviewPrepAgent from '../services/agents/InterviewPrepAgent.js';
import CareerTwinAgent from '../services/agents/CareerTwinAgent.js';
import LearningPathAgentV2 from '../services/agents/LearningPathAgentV2.js';
import RecruiterAgent from '../services/agents/RecruiterAgent.js';
import OpportunityRadarAgent from '../services/agents/OpportunityRadarAgent.js';
import { Job, Resume, CoverLetter, User, SkillGap, LearningPath, CareerTwin, Recruiter, ExternalJob } from '../routes/models/index.js';
import logger from '../utils/logger.js';
import EventBus from '../services/EventBus.js';
import ATSScoringService from '../services/ATSScoringService.js';
import MatchScoringService from '../services/MatchScoringService.js';
import SkillGapAnalysisService from '../services/SkillGapAnalysisService.js';
import CareerPredictionService from '../services/CareerPredictionService.js';
import SalaryPredictionService from '../services/SalaryPredictionService.js';
import EmbeddingService from '../services/embeddingService.js';

const jobSearchAgent = new JobSearchAgent();
const resumeAgent = new ResumeAgent();
const coverLetterAgent = new CoverLetterAgent();
const jobAnalysisAgent = new JobAnalysisAgent();
const interviewPrepAgent = new InterviewPrepAgent();
const careerTwinAgent = new CareerTwinAgent();
const learningPathAgent = new LearningPathAgentV2();
const recruiterAgent = new RecruiterAgent();
const opportunityRadarAgent = new OpportunityRadarAgent();

/**
 * Worker processor for Job Search Agent
 */
export async function jobSearchProcessor(job) {
  const { candidateId, searchParams } = job.data;
  
  try {
    logger.info(`Processing job search for candidate ${candidateId}`);
    
    const result = await jobSearchAgent.execute(null, searchParams);
    
    // Emit event for real-time updates
    EventBus.emit('job-search-completed', {
      candidateId,
      results: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Job search failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Resume Generation Agent
 */
export async function resumeGenerationProcessor(job) {
  const { candidateId, jobId, options } = job.data;
  
  try {
    logger.info(`Processing resume generation for candidate ${candidateId}, job ${jobId}`);
    
    const result = await resumeAgent.execute(null, { jobId, candidateId, ...options });
    
    // Emit event for real-time updates
    EventBus.emit('resume-generated', {
      candidateId,
      jobId,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Resume generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Cover Letter Generation Agent
 */
export async function coverLetterGenerationProcessor(job) {
  const { candidateId, jobId, options } = job.data;
  
  try {
    logger.info(`Processing cover letter generation for candidate ${candidateId}, job ${jobId}`);
    
    const result = await coverLetterAgent.execute(null, { jobId, candidateId, ...options });
    
    // Emit event for real-time updates
    EventBus.emit('cover-letter-generated', {
      candidateId,
      jobId,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Cover letter generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Job Analysis Agent
 */
export async function jobAnalysisProcessor(job) {
  const { candidateId, jobId } = job.data;
  
  try {
    logger.info(`Processing job analysis for candidate ${candidateId}, job ${jobId}`);
    
    const result = await jobAnalysisAgent.execute(null, { jobId, candidateId });
    
    // Emit event for real-time updates
    EventBus.emit('job-analyzed', {
      candidateId,
      jobId,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Job analysis failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Interview Preparation Agent
 */
export async function interviewPreparationProcessor(job) {
  const { candidateId, jobId, interviewId } = job.data;
  
  try {
    logger.info(`Processing interview preparation for candidate ${candidateId}, job ${jobId}`);
    
    const result = await interviewPrepAgent.execute(null, { jobId, candidateId, interviewId });
    
    // Emit event for real-time updates
    EventBus.emit('interview-prepared', {
      candidateId,
      jobId,
      interviewId,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Interview preparation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Career Twin Agent
 */
export async function careerTwinProcessor(job) {
  const { candidateId } = job.data;
  
  try {
    logger.info(`Processing career twin generation for candidate ${candidateId}`);
    
    const result = await careerTwinAgent.execute(null, { candidateId });
    
    // Emit event for real-time updates
    EventBus.emit('career-twin-generated', {
      candidateId,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Career twin generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Learning Path Agent
 */
export async function learningPathProcessor(job) {
  const { candidateId, targetRole, skillGaps } = job.data;
  
  try {
    logger.info(`Processing learning path generation for candidate ${candidateId}`);
    
    const result = await learningPathAgent.execute(null, { candidateId, targetRole, skillGaps });
    
    // Emit event for real-time updates
    EventBus.emit('learning-path-generated', {
      candidateId,
      targetRole,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Learning path generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Recruiter Agent
 */
export async function recruiterProcessor(job) {
  const { candidateId, recruiterId } = job.data;
  
  try {
    logger.info(`Processing recruiter analysis for candidate ${candidateId}, recruiter ${recruiterId}`);
    
    const result = await recruiterAgent.execute(null, { candidateId, recruiterId });
    
    // Emit event for real-time updates
    EventBus.emit('recruiter-analyzed', {
      candidateId,
      recruiterId,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Recruiter analysis failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Opportunity Radar Agent
 */
export async function opportunityRadarProcessor(job) {
  const { candidateId, preferences } = job.data;
  
  try {
    logger.info(`Processing opportunity radar scan for candidate ${candidateId}`);
    
    const result = await opportunityRadarAgent.execute(null, { candidateId, preferences });
    
    // Emit event for real-time updates
    EventBus.emit('opportunities-scanned', {
      candidateId,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    logger.error(`Opportunity radar scan failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Application Workflow
 */
export async function applicationWorkflowProcessor(job) {
  const { candidateId, jobId, workflowSteps } = job.data;
  
  try {
    logger.info(`Processing application workflow for candidate ${candidateId}, job ${jobId}`);
    
    const results = [];
    
    // Execute workflow steps in sequence
    for (const step of workflowSteps) {
      logger.info(`Executing workflow step: ${step.type}`);
      
      let stepResult;
      switch (step.type) {
        case 'job_analysis':
          stepResult = await jobAnalysisAgent.execute(null, { jobId, candidateId });
          break;
        case 'match_scoring':
          stepResult = await MatchScoringService.calculateMatch(candidateId, jobId);
          break;
        case 'resume_generation':
          stepResult = await resumeAgent.execute(null, { jobId, candidateId });
          break;
        case 'cover_letter_generation':
          stepResult = await coverLetterAgent.execute(null, { jobId, candidateId });
          break;
        default:
          logger.warn(`Unknown workflow step type: ${step.type}`);
      }
      
      results.push({
        step: step.type,
        result: stepResult,
        timestamp: new Date().toISOString()
      });
    }
    
    // Emit event for real-time updates
    EventBus.emit('application-workflow-completed', {
      candidateId,
      jobId,
      results,
      timestamp: new Date().toISOString()
    });
    
    return results;
  } catch (error) {
    logger.error(`Application workflow failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for ATS Scoring
 */
export async function atsScoringProcessor(job) {
  const { resumeId, jobId } = job.data;
  
  try {
    logger.info(`Processing ATS scoring for resume ${resumeId}, job ${jobId}`);
    
    const resume = await Resume.findByPk(resumeId);
    const job = await Job.findByPk(jobId);
    
    if (!resume || !job) {
      throw new Error('Resume or job not found');
    }
    
    const score = await ATSScoringService.calculateATSScore(resume, job);
    
    // Update resume version with ATS score
    if (resume.content) {
      const resumeText = typeof resume.content === 'string' ? resume.content : JSON.stringify(resume.content);
      const jobText = `${job.title} ${job.description} ${job.requirements?.join(' ')}`;
      
      const jobWords = jobText.toLowerCase().match(/\b\w+\b/g) || [];
      const resumeWords = resumeText.toLowerCase().match(/\b\w+\b/g) || [];
      
      const matches = jobWords.filter(word => resumeWords.includes(word));
      const calculatedScore = Math.round((matches.length / jobWords.length) * 100);
      
      await resume.update({ atsScore: Math.min(100, Math.max(0, calculatedScore)) });
    }
    
    // Emit event for real-time updates
    EventBus.emit('ats-scored', {
      resumeId,
      jobId,
      score,
      timestamp: new Date().toISOString()
    });
    
    return { resumeId, jobId, score };
  } catch (error) {
    logger.error(`ATS scoring failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Match Scoring
 */
export async function matchScoringProcessor(job) {
  const { candidateId, jobId } = job.data;
  
  try {
    logger.info(`Processing match scoring for candidate ${candidateId}, job ${jobId}`);
    
    const score = await MatchScoringService.calculateMatch(candidateId, jobId);
    
    // Emit event for real-time updates
    EventBus.emit('match-scored', {
      candidateId,
      jobId,
      score,
      timestamp: new Date().toISOString()
    });
    
    return { candidateId, jobId, score };
  } catch (error) {
    logger.error(`Match scoring failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Skill Gap Analysis
 */
export async function skillGapAnalysisProcessor(job) {
  const { candidateId, jobId } = job.data;
  
  try {
    logger.info(`Processing skill gap analysis for candidate ${candidateId}, job ${jobId}`);
    
    const analysis = await SkillGapAnalysisService.analyzeSkillGaps(candidateId, jobId);
    
    // Create or update skill gap record
    const user = await User.findByPk(candidateId);
    const job = await Job.findByPk(jobId);
    
    if (user && job) {
      await SkillGap.create({
        candidateId,
        jobId,
        missingSkills: analysis.missingSkills || [],
        recommendedSkills: analysis.recommendedSkills || [],
        priority: analysis.priority || 'medium',
        estimatedLearningTime: analysis.estimatedLearningTime || 'unknown'
      });
    }
    
    // Emit event for real-time updates
    EventBus.emit('skill-gap-analyzed', {
      candidateId,
      jobId,
      analysis,
      timestamp: new Date().toISOString()
    });
    
    return analysis;
  } catch (error) {
    logger.error(`Skill gap analysis failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Career Prediction
 */
export async function careerPredictionProcessor(job) {
  const { candidateId } = job.data;
  
  try {
    logger.info(`Processing career prediction for candidate ${candidateId}`);
    
    const prediction = await CareerPredictionService.predictCareer(candidateId);
    
    // Emit event for real-time updates
    EventBus.emit('career-predicted', {
      candidateId,
      prediction,
      timestamp: new Date().toISOString()
    });
    
    return prediction;
  } catch (error) {
    logger.error(`Career prediction failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Salary Prediction
 */
export async function salaryPredictionProcessor(job) {
  const { candidateId, jobId, experienceLevel } = job.data;
  
  try {
    logger.info(`Processing salary prediction for candidate ${candidateId}, job ${jobId}`);
    
    const prediction = await SalaryPredictionService.predictSalary(candidateId, jobId, experienceLevel);
    
    // Emit event for real-time updates
    EventBus.emit('salary-predicted', {
      candidateId,
      jobId,
      prediction,
      timestamp: new Date().toISOString()
    });
    
    return prediction;
  } catch (error) {
    logger.error(`Salary prediction failed: ${error.message}`);
    throw error;
  }
}

/**
 * Worker processor for Semantic Embeddings
 */
export async function semanticEmbeddingsProcessor(job) {
  const { type, entityId, content } = job.data;
  
  try {
    logger.info(`Processing semantic embedding for ${type} ${entityId}`);
    
    const embedding = await EmbeddingService.generateEmbedding(content);
    
    // Store embedding based on type
    if (type === 'job') {
      const { JobEmbedding } = await import('../routes/models/index.js');
      await JobEmbedding.upsert({
        jobId: entityId,
        embedding,
        embeddingModel: 'text-embedding-3-small',
        contentHash: Buffer.from(content).toString('base64').substring(0, 32)
      });
    } else if (type === 'resume') {
      const { ResumeEmbedding } = await import('../routes/models/index.js');
      await ResumeEmbedding.upsert({
        resumeId: entityId,
        embedding,
        embeddingModel: 'text-embedding-3-small',
        contentHash: Buffer.from(content).toString('base64').substring(0, 32)
      });
    }
    
    // Emit event for real-time updates
    EventBus.emit('embedding-generated', {
      type,
      entityId,
      timestamp: new Date().toISOString()
    });
    
    return { type, entityId, embedding };
  } catch (error) {
    logger.error(`Semantic embedding generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Export all processors for use in JobQueueService
 */
export const processors = {
  jobSearch: jobSearchProcessor,
  resumeGeneration: resumeGenerationProcessor,
  coverLetterGeneration: coverLetterGenerationProcessor,
  jobAnalysis: jobAnalysisProcessor,
  interviewPreparation: interviewPreparationProcessor,
  careerTwin: careerTwinProcessor,
  learningPath: learningPathProcessor,
  recruiter: recruiterProcessor,
  opportunityRadar: opportunityRadarProcessor,
  applicationWorkflow: applicationWorkflowProcessor,
  atsScoring: atsScoringProcessor,
  matchScoring: matchScoringProcessor,
  skillGapAnalysis: skillGapAnalysisProcessor,
  careerPrediction: careerPredictionProcessor,
  salaryPrediction: salaryPredictionProcessor,
  semanticEmbeddings: semanticEmbeddingsProcessor
};

export default processors;
