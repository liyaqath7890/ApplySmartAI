import express from 'express';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  importJob,
} from '../controllers/jobController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateCreateJob, validateUUIDParam } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:id', validateUUIDParam('id'), getJob);

// Protected routes (Candidate only)
router.post('/import', protect, restrictTo('candidate'), importJob);
router.post('/:id/apply', protect, restrictTo('candidate'), applyForJob);

// Protected routes (Recruiter only)
router.post('/', protect, restrictTo('recruiter'), validateCreateJob, createJob);
router.put('/:id', protect, restrictTo('recruiter'), validateUUIDParam('id'), updateJob);
router.delete('/:id', protect, restrictTo('recruiter'), validateUUIDParam('id'), deleteJob);

export default router;