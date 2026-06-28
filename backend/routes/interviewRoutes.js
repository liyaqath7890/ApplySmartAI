import express from 'express';
import {
  createSession,
  getSession,
  submitAnswer,
  getSessions
} from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId', getSession);
router.post('/sessions/:sessionId/questions/:questionId/answer', submitAnswer);

export default router;
