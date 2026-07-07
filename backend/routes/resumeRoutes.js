import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getResumes,
  uploadResume,
  generateResume,
  getResumeTemplates,
  deleteResume,
  setPrimary,
  getVersions,
  analyzeResume,
  tailorResume,
  revertVersion,
  deleteVersion,
  compareVersions,
  upload
} from '../controllers/resumeController.js';

const router = express.Router();

// All routes are protected and for candidates only
router.use(protect, restrictTo('candidate'));

// Resume management
router.get('/', getResumes);
router.post('/upload', upload.single('resume'), uploadResume);
router.post('/generate', generateResume);
router.delete('/:id', deleteResume);
router.patch('/:id/primary', setPrimary);
router.get('/:id/versions', getVersions);
router.post('/analyze', analyzeResume);
router.post('/tailor', tailorResume);

// Version specific actions
router.post('/versions/:versionId/revert', revertVersion);
router.delete('/versions/:versionId', deleteVersion);
router.get('/versions/compare/:v1/:v2', compareVersions);

// Templates
router.get('/templates', getResumeTemplates);

export default router;
