import OpenAI from 'openai';
import config from '../config/index.js';
import { Job, JobEmbedding, Resume, ResumeEmbedding } from '../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class EmbeddingService {
  async generateEmbedding(text) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }

  async createJobEmbedding(jobId) {
    const job = await Job.findByPk(jobId);
    if (!job) throw new Error('Job not found');

    const text = `${job.title} ${job.description} ${job.requirements?.join(' ')} ${job.location}`;
    const embedding = await this.generateEmbedding(text);
    
    const contentHash = this.hashText(text);
    
    const [jobEmbedding] = await JobEmbedding.upsert({
      jobId: job.id,
      embedding,
      embeddingModel: 'text-embedding-3-small',
      contentHash
    });

    return jobEmbedding;
  }

  async createResumeEmbedding(resumeId) {
    const resume = await Resume.findByPk(resumeId);
    if (!resume) throw new Error('Resume not found');

    const text = resume.parsedContent 
      ? JSON.stringify(resume.parsedContent)
      : `${resume.candidateId} ${resume.extractedSkills?.join(' ')}`;
    
    const embedding = await this.generateEmbedding(text);
    const contentHash = this.hashText(text);

    const [resumeEmbedding] = await ResumeEmbedding.upsert({
      resumeId: resume.id,
      embedding,
      embeddingModel: 'text-embedding-3-small',
      contentHash
    });

    return resumeEmbedding;
  }

  async semanticSearchJobs(query, limit = 20) {
    const queryEmbedding = await this.generateEmbedding(query);
    const allJobs = await Job.findAll({
      where: { status: 'active' },
      include: [{ model: JobEmbedding, as: 'embedding' }]
    });

    const results = allJobs
      .filter(job => job.embedding)
      .map(job => ({
        job: job.toJSON(),
        score: this.cosineSimilarity(queryEmbedding, job.embedding.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  async findMatchingCandidates(jobId, limit = 20) {
    const job = await Job.findByPk(jobId, {
      include: [{ model: JobEmbedding, as: 'embedding' }]
    });

    if (!job || !job.embedding) {
      throw new Error('Job or job embedding not found');
    }

    const allResumes = await Resume.findAll({
      include: [
        { model: ResumeEmbedding, as: 'embedding' },
        { model: User, as: 'candidate' }
      ]
    });

    const results = allResumes
      .filter(resume => resume.embedding)
      .map(resume => ({
        resume: resume.toJSON(),
        candidate: resume.candidate?.toJSON(),
        score: this.cosineSimilarity(job.embedding.embedding, resume.embedding.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}

export default EmbeddingService;
