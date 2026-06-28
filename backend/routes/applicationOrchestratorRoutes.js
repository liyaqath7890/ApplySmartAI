import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getApplications,
  getApplicationQueue,
  createApplicationPackage,
  reviewApplicationPackage,
  submitApplicationPackage,
  updateApplicationStatus
} from '../controllers/applicationOrchestratorController.js';

const router = express.Router();

// All routes are protected and for candidates only
router.use(protect, restrictTo('candidate'));

router.get('/', getApplications);
router.get('/queue', getApplicationQueue);
router.post('/queue', createApplicationPackage);
router.put('/queue/:id/review', reviewApplicationPackage);
router.post('/queue/:id/submit', submitApplicationPackage);

// Legacy/Status route
router.put('/:id/status', updateApplicationStatus);

export default router;
