import express from 'express';
import {
  getCandidateIntelligenceProfile,
  updateCandidateIntelligenceProfile,
  getPositioning,
  generateTargetedResume,
  getResumeVersions,
  analyzeJob,
  prepareApplication,
  generateGapExplanation,
  generateInterviewPrep,
  getInterviewPrep,
  getPrioritizedOpportunities,
  getDailyCareerReport
} from '../controllers/AdvancedCandidateIntelligenceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Module 1: Candidate Intelligence Profile
router.get('/profile', getCandidateIntelligenceProfile);
router.put('/profile', updateCandidateIntelligenceProfile);

// Module 2: Experience Positioning
router.get('/positioning', getPositioning);

// Module 3: Multi-Resume Strategy
router.post('/resume/generate', generateTargetedResume);
router.get('/resume/versions', getResumeVersions);

// Module 4: Job Requirement Analyzer
router.post('/job/analyze', analyzeJob);

// Module 5: Application Preparation
router.post('/application/prepare', prepareApplication);

// Module 6: Gap Explanation Engine
router.post('/gap-explanation', generateGapExplanation);

// Module 8: Interview Preparation
router.post('/interview-prep/generate', generateInterviewPrep);
router.get('/interview-prep/:interviewId', getInterviewPrep);

// Module 11: Opportunity Prioritization
router.get('/opportunities/prioritized', getPrioritizedOpportunities);

// Module 12: Daily Report
router.get('/daily-report', getDailyCareerReport);

export default router;
