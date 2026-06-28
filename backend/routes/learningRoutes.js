import express from 'express';
import {
  analyzeSkillGaps,
  createLearningPath,
  getLearningPaths,
  updateStepProgress
} from '../controllers/learningController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/skill-gaps', analyzeSkillGaps);
router.post('/paths', createLearningPath);
router.get('/paths', getLearningPaths);
router.patch('/steps/:stepId', updateStepProgress);

export default router;
