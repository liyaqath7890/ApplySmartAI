import OpenAI from 'openai';
import config from '../config/index.js';
import { User, Job, Skill, SkillGap } from '../routes/models/index.js';
import logger from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class SkillGapAnalysisService {
  /**
   * Analyze skill gaps between candidate and job
   */
  async analyzeSkillGaps(candidateId, jobId) {
    try {
      const candidate = await User.findByPk(candidateId, {
        include: [
          { model: Skill, as: 'skills' },
          { model: CandidateProfile, as: 'candidateProfile' }
        ]
      });

      const job = await Job.findByPk(jobId, {
        include: [
          { model: Skill, as: 'requiredSkills' }
        ]
      });

      if (!candidate || !job) {
        throw new Error('Candidate or job not found');
      }

      const candidateSkills = candidate.skills || [];
      const requiredSkills = job.requiredSkills || [];

      // Identify missing and partial skills
      const missingSkills = this.identifyMissingSkills(candidateSkills, requiredSkills);
      const partialSkills = this.identifyPartialSkills(candidateSkills, requiredSkills);
      const strongSkills = this.identifyStrongSkills(candidateSkills, requiredSkills);

      // Generate learning recommendations
      const learningRecommendations = await this.generateLearningRecommendations(
        missingSkills,
        partialSkills,
        job
      );

      // Estimate learning time
      const estimatedLearningTime = this.estimateLearningTime(missingSkills, partialSkills);

      // Determine priority
      const priority = this.determinePriority(missingSkills, partialSkills, job);

      return {
        missingSkills,
        partialSkills,
        strongSkills,
        learningRecommendations,
        estimatedLearningTime,
        priority,
        gapScore: this.calculateGapScore(missingSkills, partialSkills, requiredSkills),
        actionableSteps: this.generateActionableSteps(missingSkills, partialSkills)
      };
    } catch (error) {
      logger.error(`Skill gap analysis error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Identify missing skills
   */
  identifyMissingSkills(candidateSkills, requiredSkills) {
    const candidateSkillNames = candidateSkills.map(s => s.name.toLowerCase());
    
    return requiredSkills
      .filter(skill => !candidateSkillNames.includes(skill.name.toLowerCase()))
      .map(skill => ({
        name: skill.name,
        priority: skill.JobSkills?.priority || 1,
        category: this.categorizeSkill(skill.name)
      }));
  }

  /**
   * Identify partial skills (candidate has but at lower proficiency)
   */
  identifyPartialSkills(candidateSkills, requiredSkills) {
    const partialSkills = [];
    
    for (const requiredSkill of requiredSkills) {
      const candidateSkill = candidateSkills.find(cs => 
        cs.name.toLowerCase() === requiredSkill.name.toLowerCase()
      );

      if (candidateSkill) {
        const proficiency = candidateSkill.CandidateSkills?.proficiencyLevel || 'intermediate';
        const requiredProficiency = this.getRequiredProficiency(requiredSkill);
        
        if (this.compareProficiency(proficiency, requiredProficiency) < 0) {
          partialSkills.push({
            name: requiredSkill.name,
            currentLevel: proficiency,
            requiredLevel: requiredProficiency,
            gap: this.getProficiencyGap(proficiency, requiredProficiency),
            priority: requiredSkill.JobSkills?.priority || 1
          });
        }
      }
    }

    return partialSkills;
  }

  /**
   * Identify strong skills
   */
  identifyStrongSkills(candidateSkills, requiredSkills) {
    const requiredSkillNames = requiredSkills.map(s => s.name.toLowerCase());
    
    return candidateSkills
      .filter(skill => requiredSkillNames.includes(skill.name.toLowerCase()))
      .filter(skill => {
        const proficiency = skill.CandidateSkills?.proficiencyLevel || 'intermediate';
        return proficiency === 'advanced' || proficiency === 'expert';
      })
      .map(skill => ({
        name: skill.name,
        proficiency: skill.CandidateSkills?.proficiencyLevel,
        yearsOfExperience: skill.CandidateSkills?.yearsOfExperience || 0
      }));
  }

  /**
   * Categorize skill
   */
  categorizeSkill(skillName) {
    const categories = {
      'programming': ['javascript', 'python', 'java', 'c++', 'go', 'rust', 'typescript', 'php', 'ruby'],
      'frameworks': ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'node.js'],
      'databases': ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'],
      'cloud': ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform'],
      'devops': ['ci/cd', 'jenkins', 'git', 'linux', 'bash'],
      'data': ['machine learning', 'data science', 'analytics', 'statistics', 'pandas', 'numpy'],
      'soft': ['communication', 'leadership', 'teamwork', 'problem-solving', 'agile']
    };

    const skillLower = skillName.toLowerCase();
    for (const [category, skills] of Object.entries(categories)) {
      if (skills.some(s => skillLower.includes(s))) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Get required proficiency level for a skill
   */
  getRequiredProficiency(skill) {
    const priority = skill.JobSkills?.priority || 1;
    if (priority >= 3) return 'expert';
    if (priority === 2) return 'advanced';
    return 'intermediate';
  }

  /**
   * Compare proficiency levels
   */
  compareProficiency(current, required) {
    const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return (levels[current] || 2) - (levels[required] || 2);
  }

  /**
   * Get proficiency gap
   */
  getProficiencyGap(current, required) {
    const diff = this.compareProficiency(current, required);
    if (diff >= 0) return 'none';
    if (diff === -1) return 'minor';
    if (diff === -2) return 'moderate';
    return 'significant';
  }

  /**
   * Generate learning recommendations using AI
   */
  async generateLearningRecommendations(missingSkills, partialSkills, job) {
    try {
      const skillList = [...missingSkills, ...partialSkills].map(s => s.name).join(', ');
      
      if (!skillList) return [];

      const prompt = `
        Provide learning recommendations for these skills: ${skillList}
        
        Job context: ${job.title} at ${job.company || 'Company'}
        
        For each skill, provide:
        - Best online courses/resources
        - Estimated time to learn
        - Practice projects
        - Prerequisites
        
        Return in JSON format:
        {
          "recommendations": [
            {
              "skill": "skill name",
              "resources": ["resource1", "resource2"],
              "estimatedTime": "time estimate",
              "projects": ["project1", "project2"],
              "prerequisites": ["prereq1"]
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]).recommendations : [];
    } catch (error) {
      logger.error(`AI learning recommendations error: ${error.message}`);
      return [];
    }
  }

  /**
   * Estimate total learning time
   */
  estimateLearningTime(missingSkills, partialSkills) {
    const missingTime = missingSkills.length * 40; // 40 hours per missing skill
    const partialTime = partialSkills.reduce((sum, skill) => {
      const gapHours = {
        minor: 10,
        moderate: 20,
        significant: 30
      };
      return sum + (gapHours[skill.gap] || 20);
    }, 0);

    const totalHours = missingTime + partialTime;
    
    if (totalHours < 20) return 'Less than 1 month';
    if (totalHours < 50) return '1-2 months';
    if (totalHours < 100) return '2-3 months';
    if (totalHours < 200) return '3-6 months';
    return '6+ months';
  }

  /**
   * Determine priority level
   */
  determinePriority(missingSkills, partialSkills, job) {
    const highPriorityMissing = missingSkills.filter(s => s.priority >= 3).length;
    const highPriorityPartial = partialSkills.filter(s => s.priority >= 3).length;
    
    const totalRequired = missingSkills.length + partialSkills.length;
    
    if (totalRequired === 0) return 'low';
    if (highPriorityMissing > 2 || highPriorityPartial > 3) return 'critical';
    if (highPriorityMissing > 0 || highPriorityPartial > 0) return 'high';
    if (totalRequired > 3) return 'medium';
    return 'low';
  }

  /**
   * Calculate gap score (lower is better)
   */
  calculateGapScore(missingSkills, partialSkills, requiredSkills) {
    const totalRequired = requiredSkills.length || 1;
    const missingCount = missingSkills.length;
    const partialCount = partialSkills.length;
    
    // Weight missing skills more heavily
    const gapScore = ((missingCount * 2) + partialCount) / totalRequired;
    
    return Math.round(Math.min(100, gapScore * 100));
  }

  /**
   * Generate actionable steps
   */
  generateActionableSteps(missingSkills, partialSkills) {
    const steps = [];
    
    // Prioritize high-priority missing skills
    const highPriorityMissing = missingSkills
      .filter(s => s.priority >= 3)
      .slice(0, 3);
    
    if (highPriorityMissing.length > 0) {
      steps.push({
        action: 'Learn critical skills',
        skills: highPriorityMissing.map(s => s.name),
        timeframe: 'Immediate priority'
      });
    }

    // Address partial skills
    if (partialSkills.length > 0) {
      steps.push({
        action: 'Improve existing skills',
        skills: partialSkills.slice(0, 3).map(s => s.name),
        timeframe: 'Next 1-2 months'
      });
    }

    // Plan for remaining missing skills
    const remainingMissing = missingSkills.filter(s => s.priority < 3);
    if (remainingMissing.length > 0) {
      steps.push({
        action: 'Acquire additional skills',
        skills: remainingMissing.slice(0, 3).map(s => s.name),
        timeframe: '3-6 months'
      });
    }

    return steps;
  }

  /**
   * Get skill gap summary for a candidate across multiple jobs
   */
  async getSkillGapSummary(candidateId, jobIds) {
    const summaries = [];
    
    for (const jobId of jobIds) {
      try {
        const analysis = await this.analyzeSkillGaps(candidateId, jobId);
        const job = await Job.findByPk(jobId);
        
        summaries.push({
          jobId,
          jobTitle: job?.title,
          gapScore: analysis.gapScore,
          priority: analysis.priority,
          missingSkillCount: analysis.missingSkills.length,
          partialSkillCount: analysis.partialSkills.length
        });
      } catch (error) {
        logger.error(`Summary error for job ${jobId}: ${error.message}`);
      }
    }

    // Sort by gap score (ascending - lower gap is better)
    return summaries.sort((a, b) => a.gapScore - b.gapScore);
  }
}

export default new SkillGapAnalysisService();
