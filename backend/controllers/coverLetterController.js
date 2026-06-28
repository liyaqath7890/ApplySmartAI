import {
  User,
  CoverLetter,
  CandidateProfile,
  ExternalJob
} from '../routes/models/index.js';

import CoverLetterService from '../services/CoverLetterService.js';

// Get all cover letters for a candidate
export const getCoverLetters = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const letters = await CoverLetter.findAll({
      where: { candidateId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, coverLetters: letters });
  } catch (error) {
    console.error('Get cover letters error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate or Regenerate a cover letter
export const generateCoverLetter = async (req, res) => {
  try {
    const { jobId, customPrompt, tone, industry, templateType, feedback } = req.body;
    const candidateId = req.user.id;

    // Get candidate profile
    const candidate = await User.findByPk(candidateId, {
      include: [{ model: CandidateProfile, as: 'candidateProfile' }]
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    // Get job if provided
    let job = null;
    if (jobId) {
      job = await ExternalJob.findOne({ where: { id: jobId, candidateId } });
      if (!job) {
        job = await Job.findByPk(jobId);
      }
    }

    // Generate cover letter content using the Service
    const letterContent = await CoverLetterService.generateCoverLetterContent(
      candidateId, job, customPrompt, tone, industry, templateType, feedback
    );

    // Create cover letter
    const letter = await CoverLetter.create({
      candidateId,
      jobId: job?.id,
      title: job ? `Cover Letter for ${job.company} - ${job.title}` : 'General Cover Letter',
      content: letterContent,
      aiGenerated: true,
      aiScore: 85 // We can add ATSScoringService logic here later if needed
    });

    res.json({ success: true, coverLetter: letter });
  } catch (error) {
    console.error('Generate cover letter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a cover letter
export const updateCoverLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const letter = await CoverLetter.findOne({
      where: { id, candidateId: req.user.id }
    });

    if (!letter) {
      return res.status(404).json({ success: false, error: 'Cover letter not found' });
    }

    await letter.update({ title, content });
    res.json({ success: true, coverLetter: letter });
  } catch (error) {
    console.error('Update cover letter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a cover letter
export const deleteCoverLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const letter = await CoverLetter.findOne({
      where: { id, candidateId: req.user.id }
    });

    if (!letter) {
      return res.status(404).json({ success: false, error: 'Cover letter not found' });
    }

    await letter.destroy();
    res.json({ success: true, message: 'Cover letter deleted' });
  } catch (error) {
    console.error('Delete cover letter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
