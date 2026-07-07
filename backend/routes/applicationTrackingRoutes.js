import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  updateStatus,
  getApplicationUrl,
  downloadPackageFiles,
  getPipeline,
  saveJob,
  updateTrackingDetails,
} from '../controllers/applicationTrackingController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Pipeline view (Kanban)
router.get('/pipeline', getPipeline);

// Save a job to wishlist
router.post('/save', saveJob);

// Status transitions
router.patch('/:id/status', updateStatus);

// Tracking details update
router.post('/:id/track-details', updateTrackingDetails);

// Application package helpers
router.get('/packages/:id/apply-url', getApplicationUrl);
router.get('/packages/:id/download', downloadPackageFiles);

export default router;
