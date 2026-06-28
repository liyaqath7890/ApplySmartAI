import express from 'express';
import {
  getDashboardStats,
  getSalaryPrediction,
  getMarketDemand,
  getSkillTrends
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/salary-prediction', getSalaryPrediction);
router.get('/market-demand', getMarketDemand);
router.get('/skill-trends', getSkillTrends);

export default router;
