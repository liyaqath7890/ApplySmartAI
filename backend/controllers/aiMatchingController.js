import {
  User,
  CandidateProfile,
  Skill,
  CandidateSkills,
  ExternalJob,
  Job
} from '../routes/models/index.js';
import config from '../config/index.js';
import CandidateIntelligenceService from '../services/CandidateIntelligenceService.js';

// Match a candidate to a specific job
export const jobMatch = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;

    // Check if it is an external job
    let isExternal = false;
    let job = await ExternalJob.findOne({ where: { id: jobId, candidateId } });
    
    if (job) {
      isExternal = true;
    } else {
      job = await Job.findByPk(jobId);
    }

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Call the AI matching service
    const matchData = await CandidateIntelligenceService.matchCandidateToJob(candidateId, jobId, isExternal);

    // Update the external job with match score if applicable
    if (isExternal) {
      await job.update({
        matchScore: matchData.matchResponse.matchPercentage,
        missingSkills: matchData.matchResponse.missingSkills,
        aiAnalysis: { recommendations: matchData.matchResponse.strengths } // map recommendations
      });
    }

    res.json({
      success: true,
      match: matchData.matchResponse,
      jobAnalysis: matchData.jobAnalysisData
    });
  } catch (error) {
    console.error('Job match error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get matches for all saved jobs
export const getJobMatches = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const jobs = await ExternalJob.findAll({
      where: { candidateId },
      order: [['postedDate', 'DESC']]
    });

    const matches = [];
    for (const job of jobs) {
      try {
        const matchData = await CandidateIntelligenceService.matchCandidateToJob(candidateId, job.id, true);
        matches.push({
          job: job.toJSON(),
          match: matchData.matchResponse
        });
      } catch (err) {
        console.error(`Error matching job ${job.id}:`, err.message);
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);

    res.json({ success: true, matches });
  } catch (error) {
    console.error('Get job matches error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
