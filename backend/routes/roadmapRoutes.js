import express from 'express';
import {
  generateRoadmap,
  getRoadmaps,
  updateMilestone
} from '../controllers/careerRoadmapController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', generateRoadmap);
router.get('/', getRoadmaps);
router.patch('/milestones/:milestoneId', updateMilestone);

export default router;
