import express from 'express';
import {
  searchJobs,
  generateJobEmbedding,
  generateResumeEmbedding,
  findMatchingCandidates
} from '../controllers/embeddingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', searchJobs);
router.post('/jobs/:jobId', protect, generateJobEmbedding);
router.post('/resumes/:resumeId', protect, generateResumeEmbedding);
router.get('/jobs/:jobId/candidates', protect, findMatchingCandidates);

export default router;
