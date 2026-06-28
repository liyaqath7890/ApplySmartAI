import {
  User,
  CoverLetter,
  CandidateProfile,
  ExternalJob
} from '../routes/models/index.js';

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

// Generate a cover letter
export const generateCoverLetter = async (req, res) => {
  try {
    const { jobId, customPrompt } = req.body;
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

    // Generate cover letter content (simplified for demo)
    const letterContent = await generateCoverLetterContent(candidateId, job, customPrompt);

    // Create cover letter
    const letter = await CoverLetter.create({
      candidateId,
      jobId: job?.id,
      title: job ? `Cover Letter for ${job.company} - ${job.title}` : 'General Cover Letter',
      content: letterContent,
      aiGenerated: true,
      aiScore: 85
    });

    res.json({ success: true, coverLetter: letter });
  } catch (error) {
    console.error('Generate cover letter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

import { generateAIResponse } from '../services/openAiService.js';
import CareerProfileService from '../services/CareerProfileService.js';

// Helper function to generate cover letter content
const generateCoverLetterContent = async (candidateId, job, customPrompt, tone = 'Professional') => {
  const unifiedProfile = await CareerProfileService.getUnifiedProfile(candidateId, {
    User, CandidateProfile, Skill, WorkExperience, Education, Certification, Resume
  });

  const jobDescription = job?.description || job?.requirements?.join(', ') || 'No job description provided.';
  
  const systemPrompt = `You are an expert Executive Career Coach and Cover Letter Generator. 
  Write a highly targeted, persuasive, and ATS-optimized cover letter.
  Use a ${tone} tone. Keep it concise, engaging, and truthful to the candidate's profile.
  Focus on mapping the candidate's specific skills and experience to the job requirements.
  Do not include placeholder text like [Company Name], infer it from the job data or omit gracefully.`;

  const userPrompt = `
  Job Data:
  Title: ${job?.title || 'Unknown Title'}
  Company: ${job?.company || 'Unknown Company'}
  Description: ${jobDescription}

  Candidate Profile:
  Name: ${unifiedProfile.firstName} ${unifiedProfile.lastName}
  Headline: ${unifiedProfile.candidateProfile?.headline}
  Summary: ${unifiedProfile.candidateProfile?.summary}
  Skills: ${unifiedProfile.skills?.map(s => s.name || s).join(', ')}
  Experience: ${JSON.stringify(unifiedProfile.workExperience || [])}
  
  Custom User Instructions: ${customPrompt || 'None'}
  
  Please write the cover letter now. Return ONLY the text of the cover letter.`;

  const content = await generateAIResponse(systemPrompt, userPrompt, false);
  return content;
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
