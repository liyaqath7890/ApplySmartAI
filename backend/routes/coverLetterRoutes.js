import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getCoverLetters,
  generateCoverLetter,
  updateCoverLetter,
  deleteCoverLetter
} from '../controllers/coverLetterController.js';

const router = express.Router();

// All routes are protected and for candidates only
router.use(protect, restrictTo('candidate'));

router.get('/', getCoverLetters);
router.post('/generate', generateCoverLetter);
router.put('/:id', updateCoverLetter);
router.delete('/:id', deleteCoverLetter);

export default router;
