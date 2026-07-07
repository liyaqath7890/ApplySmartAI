import express from 'express';
import {
  getCareerTwin,
  updateCareerTwin,
  analyzeWeaknesses,
  getGrowthRecommendations,
  getRecruiters,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getRecruiterInteractions,
  createRecruiterInteraction,
  generateOutreachMessage,
  getInterviewPreparation,
  createInterviewPreparation,
  getJobPredictions,
  predictJob,
  getAnalytics,
  careerCopilotChat,
  getNetworkingContacts,
  createNetworkingContact,
  updateNetworkingContact,
  deleteNetworkingContact,
  getDailyCoachPlan,
  updateCoachChecklist,
  getCalendarEvents,
  exportCalendarIcs
} from '../controllers/v2Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Career Twin
router.get('/career-twin', getCareerTwin);
router.put('/career-twin', updateCareerTwin);
router.post('/career-twin/analyze-weaknesses', analyzeWeaknesses);
router.get('/career-twin/growth-recommendations', getGrowthRecommendations);

// Recruiters
router.get('/recruiters', getRecruiters);
router.post('/recruiters', createRecruiter);
router.put('/recruiters/:id', updateRecruiter);
router.delete('/recruiters/:id', deleteRecruiter);
router.get('/recruiters/interactions', getRecruiterInteractions);
router.post('/recruiters/interactions', createRecruiterInteraction);
router.post('/recruiters/:id/generate-message', generateOutreachMessage);

// Networking Contacts
router.get('/networking', getNetworkingContacts);
router.post('/networking', createNetworkingContact);
router.put('/networking/:id', updateNetworkingContact);
router.delete('/networking/:id', deleteNetworkingContact);

// Daily AI Coach
router.get('/coach/daily-plan', getDailyCoachPlan);
router.post('/coach/checklist', updateCoachChecklist);

// Smart Calendar
router.get('/calendar/events', getCalendarEvents);
router.get('/calendar/export', exportCalendarIcs);

// Interview Preparation
router.get('/interview-prep/:interviewId', getInterviewPreparation);
router.post('/interview-prep', createInterviewPreparation);

// Predictions
router.get('/predictions', getJobPredictions);
router.post('/predictions/predict', predictJob);

// Analytics
router.get('/analytics', getAnalytics);

// AI Career Copilot
router.post('/copilot/chat', careerCopilotChat);

export default router;
