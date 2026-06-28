import express from 'express';
import multer from 'multer';
import { protect, restrictTo } from '../middleware/auth.js';
import { jobMatch, getJobMatches } from '../controllers/aiMatchingController.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Configure multer for file uploads (resume)
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF files are allowed for resume upload', 400), false);
    }
  },
});

// @desc    Get match scores for all saved jobs
// @route   GET /api/ai/matches
// @access  Private (Candidate only)
router.get('/matches', protect, restrictTo('candidate'), getJobMatches);

// @desc    AI Job Matching (Upload resume and get match score for a job)
// @route   POST /api/ai/match-job/:jobId
// @access  Private (Candidate only)
router.post('/match-job/:jobId', protect, restrictTo('candidate'), upload.single('resume'), jobMatch);

export default router;