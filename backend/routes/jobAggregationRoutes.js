import express from 'express';
import {
  aggregateJobs,
  getSupportedPlatforms,
  createApplicationPackage,
  getApplicationPackages,
  reviewApplicationPackage,
  submitApplication
} from '../controllers/jobAggregationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Job Aggregation Routes
router.get('/platforms', protect, getSupportedPlatforms);
router.post('/aggregate', protect, aggregateJobs);

// Application Package Routes
router.post('/application-packages', protect, createApplicationPackage);
router.get('/application-packages', protect, getApplicationPackages);
router.post('/application-packages/:id/review', protect, reviewApplicationPackage);
router.post('/application-packages/:id/submit', protect, submitApplication);

export default router;
