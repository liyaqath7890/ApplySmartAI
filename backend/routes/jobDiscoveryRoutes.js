import express from 'express';
import {
  searchJobs,
  getSavedJobs,
  getJob,
  getPlatformCredentials,
  addPlatformCredential,
  updatePlatformCredential,
  deletePlatformCredential
} from '../controllers/jobDiscoveryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Job search
router.post('/search', searchJobs);
router.get('/jobs', getSavedJobs);
router.get('/jobs/:id', getJob);

// Platform credentials
router.get('/credentials', getPlatformCredentials);
router.post('/credentials', addPlatformCredential);
router.put('/credentials/:id', updatePlatformCredential);
router.delete('/credentials/:id', deletePlatformCredential);

export default router;
