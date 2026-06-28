import { Resume, ResumeVersion, Job, User } from '../routes/models/index.js';
import ResumeAgent from './agents/resumeAgent.js';
import ATSScoringService from './ATSScoringService.js';
import AuditLogService from './AuditLogService.js';
import logger from '../utils/logger.js';

class ResumeVersioningService {
  /**
   * Create a new resume version
   */
  async createVersion(candidateId, resumeId, jobId, options = {}) {
    try {
      const resume = await Resume.findByPk(resumeId);
      const job = jobId ? await Job.findByPk(jobId) : null;
      const user = await User.findByPk(candidateId);

      if (!resume) {
        throw new Error('Resume not found');
      }

      // Get current version count
      const currentVersions = await ResumeVersion.findAll({
        where: { resumeId },
        order: [['versionNumber', 'DESC']]
      });

      const nextVersionNumber = currentVersions.length > 0 
        ? Math.max(...currentVersions.map(v => v.versionNumber)) + 1 
        : 1;

      // Generate tailored content if jobId provided
      let content = resume.content;
      let atsScore = 0;
      let isAiGenerated = false;

      if (job && options.generateTailored) {
        const resumeAgent = new ResumeAgent();
        const result = await resumeAgent.execute(null, { jobId, candidateId });
        
        if (result && result.version) {
          content = result.version.content;
          isAiGenerated = true;
          
          // Calculate ATS score
          if (job) {
            const atsResult = await ATSScoringService.calculateATSScore(resume, job);
            atsScore = atsResult.overallScore;
          }
        }
      }

      // Create new version
      const version = await ResumeVersion.create({
        resumeId,
        jobId: jobId || null,
        versionNumber: nextVersionNumber,
        title: options.title || `Version ${nextVersionNumber}${job ? ` - ${job.title}` : ''}`,
        content: content || resume.content,
        atsScore,
        isCurrent: options.isCurrent || true,
        isAiGenerated,
        changes: options.changes || {},
        createdAt: new Date()
      });

      // Set all other versions to not current if this one is current
      if (version.isCurrent) {
        await ResumeVersion.update(
          { isCurrent: false },
          {
            where: {
              resumeId,
              id: { [Op.ne]: version.id }
            }
          }
        );
      }

      // Log the version creation
      await AuditLogService.log({
        entityType: 'ResumeVersion',
        entityId: version.id,
        action: 'create',
        userId: candidateId,
        actorType: 'user',
        newState: {
          versionNumber: version.versionNumber,
          jobId: version.jobId,
          isAiGenerated: version.isAiGenerated,
          atsScore: version.atsScore
        },
        status: 'success'
      });

      logger.info(`Created resume version ${nextVersionNumber} for resume ${resumeId}`);
      return version;
    } catch (error) {
      logger.error(`Resume version creation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all versions of a resume
   */
  async getVersions(resumeId) {
    try {
      const versions = await ResumeVersion.findAll({
        where: { resumeId },
        include: [
          { model: Job, as: 'targetJob' }
        ],
        order: [['versionNumber', 'DESC']]
      });

      return versions;
    } catch (error) {
      logger.error(`Error fetching resume versions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current version of a resume
   */
  async getCurrentVersion(resumeId) {
    try {
      const version = await ResumeVersion.findOne({
        where: { resumeId, isCurrent: true },
        include: [
          { model: Job, as: 'targetJob' }
        ]
      });

      return version;
    } catch (error) {
      logger.error(`Error fetching current resume version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set a specific version as current
   */
  async setCurrentVersion(versionId, candidateId) {
    try {
      const version = await ResumeVersion.findByPk(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // Set all versions to not current
      await ResumeVersion.update(
        { isCurrent: false },
        { where: { resumeId: version.resumeId } }
      );

      // Set specified version as current
      await version.update({ isCurrent: true });

      // Log the change
      await AuditLogService.log({
        entityType: 'ResumeVersion',
        entityId: versionId,
        action: 'set_current',
        userId: candidateId,
        actorType: 'user',
        newState: { isCurrent: true },
        status: 'success'
      });

      logger.info(`Set resume version ${version.versionNumber} as current`);
      return version;
    } catch (error) {
      logger.error(`Error setting current version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1, versionId2) {
    try {
      const version1 = await ResumeVersion.findByPk(versionId1);
      const version2 = await ResumeVersion.findByPk(versionId2);

      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }

      const comparison = {
        version1: {
          id: version1.id,
          versionNumber: version1.versionNumber,
          atsScore: version1.atsScore,
          createdAt: version1.createdAt
        },
        version2: {
          id: version2.id,
          versionNumber: version2.versionNumber,
          atsScore: version2.atsScore,
          createdAt: version2.createdAt
        },
        atsScoreDifference: version2.atsScore - version1.atsScore,
        contentChanges: this.detectChanges(version1.content, version2.content)
      };

      return comparison;
    } catch (error) {
      logger.error(`Error comparing versions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect changes between two content objects
   */
  detectChanges(content1, content2) {
    const changes = {
      added: [],
      removed: [],
      modified: []
    };

    if (!content1 || !content2) {
      return changes;
    }

    // Compare skills
    if (content1.skills && content2.skills) {
      const skills1 = new Set(content1.skills.map(s => s.name || s));
      const skills2 = new Set(content2.skills.map(s => s.name || s));

      changes.added = [...skills2].filter(s => !skills1.has(s));
      changes.removed = [...skills1].filter(s => !skills2.has(s));
    }

    // Compare experience
    if (content1.experience && content2.experience) {
      const exp1 = content1.experience.length;
      const exp2 = content2.experience.length;
      
      if (exp1 !== exp2) {
        changes.modified.push(`Experience entries changed from ${exp1} to ${exp2}`);
      }
    }

    return changes;
  }

  /**
   * Delete a version (except current)
   */
  async deleteVersion(versionId, candidateId) {
    try {
      const version = await ResumeVersion.findByPk(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      if (version.isCurrent) {
        throw new Error('Cannot delete current version');
      }

      await version.destroy();

      // Log the deletion
      await AuditLogService.log({
        entityType: 'ResumeVersion',
        entityId: versionId,
        action: 'delete',
        userId: candidateId,
        actorType: 'user',
        previousState: {
          versionNumber: version.versionNumber,
          content: version.content
        },
        status: 'success'
      });

      logger.info(`Deleted resume version ${version.versionNumber}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get version history with statistics
   */
  async getVersionHistory(resumeId) {
    try {
      const versions = await this.getVersions(resumeId);
      
      const stats = {
        totalVersions: versions.length,
        currentVersion: versions.find(v => v.isCurrent),
        averageATSScore: 0,
        highestATSScore: 0,
        lowestATSScore: 100,
        aiGeneratedCount: 0,
        manuallyCreatedCount: 0
      };

      if (versions.length > 0) {
        const atsScores = versions.map(v => v.atsScore).filter(s => s > 0);
        if (atsScores.length > 0) {
          stats.averageATSScore = Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length);
          stats.highestATSScore = Math.max(...atsScores);
          stats.lowestATSScore = Math.min(...atsScores);
        }

        stats.aiGeneratedCount = versions.filter(v => v.isAiGenerated).length;
        stats.manuallyCreatedCount = versions.filter(v => !v.isAiGenerated).length;
      }

      return {
        versions,
        stats
      };
    } catch (error) {
      logger.error(`Error fetching version history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revert to a previous version
   */
  async revertToVersion(versionId, candidateId) {
    try {
      const targetVersion = await ResumeVersion.findByPk(versionId);
      if (!targetVersion) {
        throw new Error('Version not found');
      }

      // Create a new version with the content of the target version
      const newVersion = await this.createVersion(
        candidateId,
        targetVersion.resumeId,
        targetVersion.jobId,
        {
          title: `Reverted to v${targetVersion.versionNumber}`,
          content: targetVersion.content,
          changes: {
            revertedFrom: targetVersion.versionNumber,
            revertedAt: new Date().toISOString()
          }
        }
      );

      logger.info(`Reverted resume to version ${targetVersion.versionNumber}`);
      return newVersion;
    } catch (error) {
      logger.error(`Error reverting version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get versions by job
   */
  async getVersionsByJob(jobId) {
    try {
      const versions = await ResumeVersion.findAll({
        where: { jobId },
        include: [
          { model: Resume, as: 'resume' },
          { model: Job, as: 'targetJob' }
        ],
        order: [['versionNumber', 'DESC']]
      });

      return versions;
    } catch (error) {
      logger.error(`Error fetching versions by job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Auto-generate version for job application
   */
  async autoGenerateForJob(candidateId, resumeId, jobId) {
    try {
      const version = await this.createVersion(candidateId, resumeId, jobId, {
        generateTailored: true,
        isCurrent: false,
        title: `Auto-generated for job application`
      });

      logger.info(`Auto-generated resume version for job ${jobId}`);
      return version;
    } catch (error) {
      logger.error(`Error auto-generating version: ${error.message}`);
      throw error;
    }
  }
}

export default new ResumeVersioningService();
