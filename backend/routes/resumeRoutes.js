import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getResumes,
  uploadResume,
  generateResume,
  getResumeTemplates,
  upload
} from '../controllers/resumeController.js';

const router = express.Router();

// All routes are protected and for candidates only
router.use(protect, restrictTo('candidate'));

// Resume management
router.get('/', getResumes);
router.post('/upload', upload.single('resume'), uploadResume);
router.post('/generate', generateResume);

// Templates
router.get('/templates', getResumeTemplates);

export default router;
