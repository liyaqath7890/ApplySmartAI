import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getWorkspaceDetails,
  generateTailoredResume,
  generateCoverLetter,
  updateCoverLetter,
  getInterviewPrepQuestions,
  getCompanyIntel
} from '../controllers/workspaceController.js';

const router = express.Router();

// All routes require candidate authentication
router.use(protect, restrictTo('candidate'));

router.get('/:applicationId', getWorkspaceDetails);
router.post('/:applicationId/resume', generateTailoredResume);
router.post('/:applicationId/cover-letter', generateCoverLetter);
router.put('/:applicationId/cover-letter', updateCoverLetter);
router.get('/:applicationId/interview-prep', getInterviewPrepQuestions);
router.get('/:applicationId/company-intel', getCompanyIntel);

export default router;
