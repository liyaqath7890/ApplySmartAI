import EmbeddingService from '../services/embeddingService.js';
import { Job, Resume } from '../routes/models/index.js';

const embeddingService = new EmbeddingService();

export const searchJobs = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const results = await embeddingService.semanticSearchJobs(q, parseInt(limit));
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateJobEmbedding = async (req, res) => {
  try {
    const { jobId } = req.params;
    const embedding = await embeddingService.createJobEmbedding(jobId);
    res.json({ success: true, embedding });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateResumeEmbedding = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const embedding = await embeddingService.createResumeEmbedding(resumeId);
    res.json({ success: true, embedding });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const findMatchingCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit = 20 } = req.query;
    const candidates = await embeddingService.findMatchingCandidates(jobId, parseInt(limit));
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
