import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { matchJobWithResume } from './aiMatchingService.js';

// @desc    AI Job Matching
// @route   POST /api/ai/match-job/:jobId
// @access  Private (Candidate only)
export const jobMatch = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const userId = req.user.id; // Assuming req.user is populated by protect middleware

  if (!req.file) {
    return next(new AppError('Resume PDF file is required for job matching', 400));
  }

  const resumeBuffer = req.file.buffer; // Multer stores file buffer by default

  const matchResults = await matchJobWithResume(userId, jobId, resumeBuffer);

  if (!matchResults) {
    return next(new AppError('Unable to process job match at this time.', 500));
  }

  res.status(200).json({
    success: true,
    data: matchResults,
  });
});