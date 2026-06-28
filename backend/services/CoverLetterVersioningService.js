import { CoverLetter, Job, User } from '../routes/models/index.js';
import CoverLetterAgent from './agents/coverLetterAgent.js';
import AuditLogService from './AuditLogService.js';
import logger from '../utils/logger.js';

class CoverLetterVersioningService {
  /**
   * Create a new cover letter version
   */
  async createVersion(candidateId, jobId, options = {}) {
    try {
      const job = await Job.findByPk(jobId);
      const user = await User.findByPk(candidateId, {
        include: ['candidateProfile']
      });

      if (!job) {
        throw new Error('Job not found');
      }

      if (!user) {
        throw new Error('Candidate not found');
      }

      // Get existing cover letters for this job
      const existingLetters = await CoverLetter.findAll({
        where: { candidateId, jobId },
        order: [['createdAt', 'DESC']]
      });

      // Generate content
      let content;
      let aiScore = 0;
      let isAiGenerated = false;

      if (options.generateContent !== false) {
        const coverLetterAgent = new CoverLetterAgent();
        const result = await coverLetterAgent.execute(null, { jobId, candidateId });
        
        if (result && result.coverLetter) {
          content = result.coverLetter.content;
          isAiGenerated = true;
          aiScore = this.calculateAIScore(content, job);
        }
      } else {
        content = options.content || '';
      }

      // Create cover letter
      const coverLetter = await CoverLetter.create({
        candidateId,
        jobId,
        title: options.title || `Cover Letter for ${job.title} at ${job.company}`,
        content,
        aiGenerated: isAiGenerated,
        aiScore,
        version: existingLetters.length + 1,
        tone: options.tone || 'professional',
        length: content.length,
        createdAt: new Date()
      });

      // Log the creation
      await AuditLogService.log({
        entityType: 'CoverLetter',
        entityId: coverLetter.id,
        action: 'create',
        userId: candidateId,
        actorType: 'user',
        newState: {
          jobId,
          aiGenerated: isAiGenerated,
          aiScore,
          tone: options.tone
        },
        status: 'success'
      });

      logger.info(`Created cover letter version ${coverLetter.version} for job ${jobId}`);
      return coverLetter;
    } catch (error) {
      logger.error(`Cover letter version creation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all cover letters for a candidate
   */
  async getCandidateCoverLetters(candidateId) {
    try {
      const coverLetters = await CoverLetter.findAll({
        where: { candidateId },
        include: [
          { model: Job, as: 'targetJob' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return coverLetters;
    } catch (error) {
      logger.error(`Error fetching candidate cover letters: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cover letters for a specific job
   */
  async getJobCoverLetters(candidateId, jobId) {
    try {
      const coverLetters = await CoverLetter.findAll({
        where: { candidateId, jobId },
        include: [
          { model: Job, as: 'targetJob' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return coverLetters;
    } catch (error) {
      logger.error(`Error fetching job cover letters: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a cover letter
   */
  async updateVersion(coverLetterId, candidateId, updates) {
    try {
      const coverLetter = await CoverLetter.findByPk(coverLetterId);
      
      if (!coverLetter) {
        throw new Error('Cover letter not found');
      }

      if (coverLetter.candidateId !== candidateId) {
        throw new Error('Unauthorized');
      }

      const previousContent = coverLetter.content;
      
      await coverLetter.update(updates);

      // Log the update
      await AuditLogService.log({
        entityType: 'CoverLetter',
        entityId: coverLetterId,
        action: 'update',
        userId: candidateId,
        actorType: 'user',
        previousState: { content: previousContent },
        newState: { content: updates.content },
        changes: updates,
        status: 'success'
      });

      logger.info(`Updated cover letter ${coverLetterId}`);
      return coverLetter;
    } catch (error) {
      logger.error(`Cover letter update error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a cover letter
   */
  async deleteVersion(coverLetterId, candidateId) {
    try {
      const coverLetter = await CoverLetter.findByPk(coverLetterId);
      
      if (!coverLetter) {
        throw new Error('Cover letter not found');
      }

      if (coverLetter.candidateId !== candidateId) {
        throw new Error('Unauthorized');
      }

      await coverLetter.destroy();

      // Log the deletion
      await AuditLogService.log({
        entityType: 'CoverLetter',
        entityId: coverLetterId,
        action: 'delete',
        userId: candidateId,
        actorType: 'user',
        previousState: {
          title: coverLetter.title,
          content: coverLetter.content
        },
        status: 'success'
      });

      logger.info(`Deleted cover letter ${coverLetterId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Cover letter deletion error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compare two cover letters
   */
  async compareVersions(coverLetterId1, coverLetterId2) {
    try {
      const coverLetter1 = await CoverLetter.findByPk(coverLetterId1);
      const coverLetter2 = await CoverLetter.findByPk(coverLetterId2);

      if (!coverLetter1 || !coverLetter2) {
        throw new Error('One or both cover letters not found');
      }

      const comparison = {
        coverLetter1: {
          id: coverLetter1.id,
          title: coverLetter1.title,
          aiScore: coverLetter1.aiScore,
          length: coverLetter1.length,
          createdAt: coverLetter1.createdAt
        },
        coverLetter2: {
          id: coverLetter2.id,
          title: coverLetter2.title,
          aiScore: coverLetter2.aiScore,
          length: coverLetter2.length,
          createdAt: coverLetter2.createdAt
        },
        scoreDifference: coverLetter2.aiScore - coverLetter1.aiScore,
        lengthDifference: coverLetter2.length - coverLetter1.length,
        contentChanges: this.detectChanges(coverLetter1.content, coverLetter2.content)
      };

      return comparison;
    } catch (error) {
      logger.error(`Error comparing cover letters: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect changes between two cover letters
   */
  detectChanges(content1, content2) {
    const changes = {
      addedParagraphs: [],
      removedParagraphs: [],
      modifiedParagraphs: []
    };

    if (!content1 || !content2) {
      return changes;
    }

    const paragraphs1 = content1.split('\n\n').filter(p => p.trim());
    const paragraphs2 = content2.split('\n\n').filter(p => p.trim());

    // Simple comparison - in production, use diff algorithm
    if (paragraphs2.length > paragraphs1.length) {
      changes.addedParagraphs = paragraphs2.slice(paragraphs1.length);
    } else if (paragraphs1.length > paragraphs2.length) {
      changes.removedParagraphs = paragraphs1.slice(paragraphs2.length);
    }

    return changes;
  }

  /**
   * Calculate AI score for cover letter
   */
  calculateAIScore(content, job) {
    let score = 50;

    if (!content) return score;

    // Check for key elements
    const jobTitle = job.title?.toLowerCase() || '';
    const companyName = job.company?.toLowerCase() || '';
    const contentLower = content.toLowerCase();

    // Mention of company
    if (contentLower.includes(companyName)) score += 10;

    // Mention of job title
    if (contentLower.includes(jobTitle)) score += 10;

    // Professional length (200-500 words)
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 200 && wordCount <= 500) score += 15;

    // Has proper structure
    if (content.includes('Dear') && content.includes('Sincerely')) score += 10;

    // No placeholders
    if (!content.includes('[Company]') && !content.includes('[Position]')) score += 5;

    return Math.min(100, score);
  }

  /**
   * Get cover letter statistics for a candidate
   */
  async getCandidateStatistics(candidateId) {
    try {
      const coverLetters = await this.getCandidateCoverLetters(candidateId);
      
      const stats = {
        totalCoverLetters: coverLetters.length,
        aiGeneratedCount: 0,
        manuallyCreatedCount: 0,
        averageAIScore: 0,
        highestAIScore: 0,
        averageLength: 0,
        toneDistribution: {}
      };

      if (coverLetters.length > 0) {
        const aiScores = coverLetters.map(cl => cl.aiScore).filter(s => s > 0);
        if (aiScores.length > 0) {
          stats.averageAIScore = Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length);
          stats.highestAIScore = Math.max(...aiScores);
        }

        stats.aiGeneratedCount = coverLetters.filter(cl => cl.aiGenerated).length;
        stats.manuallyCreatedCount = coverLetters.filter(cl => !cl.aiGenerated).length;

        const lengths = coverLetters.map(cl => cl.length);
        stats.averageLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

        coverLetters.forEach(cl => {
          const tone = cl.tone || 'professional';
          stats.toneDistribution[tone] = (stats.toneDistribution[tone] || 0) + 1;
        });
      }

      return stats;
    } catch (error) {
      logger.error(`Error fetching cover letter statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Regenerate cover letter with different tone
   */
  async regenerateWithTone(coverLetterId, candidateId, tone) {
    try {
      const existingLetter = await CoverLetter.findByPk(coverLetterId);
      
      if (!existingLetter) {
        throw new Error('Cover letter not found');
      }

      if (existingLetter.candidateId !== candidateId) {
        throw new Error('Unauthorized');
      }

      // Create new version with different tone
      const newLetter = await this.createVersion(candidateId, existingLetter.jobId, {
        tone,
        generateContent: true,
        title: `${existingLetter.title} (${tone})`
      });

      logger.info(`Regenerated cover letter with tone: ${tone}`);
      return newLetter;
    } catch (error) {
      logger.error(`Cover letter regeneration error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cover letter templates
   */
  async getTemplates() {
    return {
      professional: {
        tone: 'professional',
        style: 'Formal and business-focused',
        bestFor: 'Corporate positions, traditional companies'
      },
      casual: {
        tone: 'casual',
        style: 'Friendly and approachable',
        bestFor: 'Startups, creative roles, modern tech companies'
      },
      enthusiastic: {
        tone: 'enthusiastic',
        style: 'High energy and passionate',
        bestFor: 'Sales, marketing, customer-facing roles'
      },
      concise: {
        tone: 'concise',
        style: 'Brief and to the point',
        bestFor: 'Busy recruiters, high-volume hiring'
      }
    };
  }
}

export default new CoverLetterVersioningService();
