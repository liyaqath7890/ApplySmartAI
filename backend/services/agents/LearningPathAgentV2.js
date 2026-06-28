import OpenAI from 'openai';
import config from '../../config/index.js';
import { User, LearningPath, LearningStep, Skill, SkillGap } from '../../routes/models/index.js';
import logger from '../../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class LearningPathAgentV2 {
  async execute(agent, inputData) {
    const { candidateId, targetRole, skillGaps } = inputData;

    try {
      const candidate = await User.findByPk(candidateId, {
        include: [
          'candidateProfile',
          'skills'
        ]
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      return await this.generateLearningPath(candidate, targetRole, skillGaps);
    } catch (error) {
      logger.error(`Learning path generation error: ${error.message}`);
      throw error;
    }
  }

  async generateLearningPath(candidate, targetRole, skillGaps) {
    try {
      const profile = candidate.candidateProfile;
      const currentSkills = candidate.skills?.map(s => s.name) || [];
      const gaps = skillGaps || [];

      const prompt = `
        Generate a comprehensive learning path for this candidate.
        
        Target Role: ${targetRole || profile?.careerGoal || 'Not specified'}
        Current Skills: ${currentSkills.join(', ')}
        Skill Gaps: ${gaps.map(g => g.name || g).join(', ')}
        Experience Level: ${profile?.experienceLevel || 'Not specified'}
        
        Create a structured learning path with:
        - Clear modules/stages
        - Duration for each module
        - Specific resources (courses, documentation, tutorials)
        - Practice projects
        - Prerequisites
        - Learning objectives
        - Assessment criteria
        
        Return in JSON format:
        {
          "title": "Learning Path Title",
          "targetRole": "role",
          "estimatedDuration": "total time",
          "modules": [
            {
              "id": 1,
              "title": "Module Title",
              "duration": "time estimate",
              "objectives": ["objective1", "objective2"],
              "prerequisites": ["prereq1"],
              "resources": [
                {
                  "type": "course|documentation|tutorial",
                  "name": "resource name",
                  "url": "resource URL",
                  "provider": "provider name"
                }
              ],
              "projects": [
                {
                  "name": "project name",
                  "description": "project description",
                  "skills": ["skill1", "skill2"]
                }
              ],
              "assessment": "assessment criteria"
            }
          ],
          "milestones": ["milestone1", "milestone2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      const learningPathData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!learningPathData) {
        throw new Error('Failed to generate learning path');
      }

      // Create learning path record
      const learningPath = await LearningPath.create({
        candidateId: candidate.id,
        title: learningPathData.title,
        targetRole: targetRole || learningPathData.targetRole,
        estimatedDuration: learningPathData.estimatedDuration,
        status: 'active',
        progress: 0,
        startDate: new Date()
      });

      // Create learning steps
      for (const module of learningPathData.modules) {
        await LearningStep.create({
          learningPathId: learningPath.id,
          title: module.title,
          description: module.objectives?.join(', ') || '',
          duration: module.duration,
          order: module.id,
          status: 'pending',
          resources: module.resources,
          projects: module.projects,
          prerequisites: module.prerequisites,
          assessment: module.assessment
        });
      }

      return {
        learningPathId: learningPath.id,
        ...learningPathData,
        createdAt: learningPath.createdAt
      };
    } catch (error) {
      logger.error(`Learning path generation error: ${error.message}`);
      throw error;
    }
  }

  async trackProgress(candidateId, { learningPathId, stepId, completionPercentage }) {
    try {
      const learningPath = await LearningPath.findByPk(learningPathId);
      if (!learningPath) {
        throw new Error('Learning path not found');
      }

      if (stepId) {
        // Update specific step
        const step = await LearningStep.findByPk(stepId);
        if (step) {
          await step.update({
            status: completionPercentage >= 100 ? 'completed' : 'in_progress',
            completedAt: completionPercentage >= 100 ? new Date() : null
          });
        }
      }

      // Recalculate overall progress
      const steps = await LearningStep.findAll({
        where: { learningPathId }
      });

      const completedSteps = steps.filter(s => s.status === 'completed').length;
      const totalProgress = Math.round((completedSteps / steps.length) * 100);

      await learningPath.update({
        progress: totalProgress,
        status: totalProgress === 100 ? 'completed' : 'active',
        completedAt: totalProgress === 100 ? new Date() : null
      });

      return { success: true, progress: totalProgress };
    } catch (error) {
      logger.error(`Progress tracking error: ${error.message}`);
      throw error;
    }
  }
}

export default LearningPathAgentV2;
