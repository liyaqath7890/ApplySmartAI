import OpenAI from 'openai';
import config from '../config/index.js';
import { User, Job, Skill, CandidateSkills, JobSkills } from '../routes/models/index.js';
import logger from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class MatchScoringService {
  /**
   * Calculate match score between candidate and job
   */
  async calculateMatch(candidateId, jobId) {
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

      // Calculate different scoring components
      const skillScore = await this.calculateSkillMatch(candidate, job);
      const experienceScore = this.calculateExperienceMatch(candidate, job);
      const locationScore = this.calculateLocationMatch(candidate, job);
      const salaryScore = this.calculateSalaryMatch(candidate, job);
      const aiScore = await this.calculateAIMatch(candidate, job);

      // Weighted overall score
      const overallScore = Math.round(
        (skillScore * 0.35) +
        (experienceScore * 0.25) +
        (locationScore * 0.15) +
        (salaryScore * 0.10) +
        (aiScore * 0.15)
      );

      return {
        overallScore,
        components: {
          skillScore,
          experienceScore,
          locationScore,
          salaryScore,
          aiScore
        },
        details: {
          matchedSkills: this.getMatchedSkills(candidate, job),
          missingSkills: this.getMissingSkills(candidate, job),
          experienceLevel: this.getExperienceLevel(candidate),
          requiredExperience: job.experienceLevel,
          locationMatch: this.getLocationMatchDetails(candidate, job)
        },
        recommendation: this.getRecommendation(overallScore)
      };
    } catch (error) {
      logger.error(`Match scoring error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate skill match score
   */
  async calculateSkillMatch(candidate, job) {
    const candidateSkills = candidate.skills || [];
    const requiredSkills = job.requiredSkills || [];

    if (requiredSkills.length === 0) return 100;

    let matchedCount = 0;
    let weightedScore = 0;

    for (const jobSkill of requiredSkills) {
      const candidateSkill = candidateSkills.find(cs => 
        cs.name.toLowerCase() === jobSkill.name.toLowerCase()
      );

      if (candidateSkill) {
        matchedCount++;
        // Check proficiency level if available
        const proficiency = this.getProficiencyScore(candidateSkill);
        const priority = jobSkill.JobSkills?.priority || 1;
        weightedScore += (proficiency * priority);
      }
    }

    const baseScore = (matchedCount / requiredSkills.length) * 100;
    const maxWeightedScore = requiredSkills.reduce((sum, js) => sum + (js.JobSkills?.priority || 1), 0);
    const weightedMatchScore = maxWeightedScore > 0 ? (weightedScore / maxWeightedScore) * 100 : baseScore;

    return Math.round((baseScore + weightedMatchScore) / 2);
  }

  /**
   * Get proficiency score
   */
  getProficiencyScore(skill) {
    const proficiency = skill.CandidateSkills?.proficiencyLevel || 'intermediate';
    const scores = {
      beginner: 40,
      intermediate: 60,
      advanced: 80,
      expert: 100
    };
    return scores[proficiency] || 60;
  }

  /**
   * Calculate experience match score
   */
  calculateExperienceMatch(candidate, job) {
    const candidateExperience = this.getExperienceLevel(candidate);
    const requiredExperience = job.experienceLevel || 'mid';

    const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
    const candidateIndex = levels.indexOf(candidateExperience.toLowerCase());
    const requiredIndex = levels.indexOf(requiredExperience.toLowerCase());

    if (candidateIndex === -1 || requiredIndex === -1) return 50;

    const diff = candidateIndex - requiredIndex;
    
    if (diff >= 0) return 100; // Candidate meets or exceeds requirement
    if (diff === -1) return 70; // Slightly under
    if (diff === -2) return 40; // Significantly under
    return 20; // Way under
  }

  /**
   * Get candidate experience level
   */
  getExperienceLevel(candidate) {
    const profile = candidate.candidateProfile;
    if (profile?.experienceLevel) return profile.experienceLevel;

    // Calculate from work experience if available
    const totalYears = candidate.workExperience?.reduce((sum, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return sum + years;
    }, 0) || 0;

    if (totalYears < 1) return 'entry';
    if (totalYears < 3) return 'junior';
    if (totalYears < 5) return 'mid';
    if (totalYears < 8) return 'senior';
    if (totalYears < 12) return 'lead';
    return 'executive';
  }

  /**
   * Calculate location match score
   */
  calculateLocationMatch(candidate, job) {
    if (job.isRemote) return 100;

    const candidateLocation = candidate.candidateProfile?.location?.toLowerCase() || '';
    const jobLocation = job.location?.toLowerCase() || '';

    if (!candidateLocation || !jobLocation) return 50;

    if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      return 100;
    }

    // Check for same country/region
    const candidateCountry = candidateLocation.split(',').pop().trim();
    const jobCountry = jobLocation.split(',').pop().trim();

    if (candidateCountry === jobCountry) return 70;

    return 30;
  }

  /**
   * Calculate salary match score
   */
  calculateSalaryMatch(candidate, job) {
    const candidateSalary = candidate.candidateProfile?.expectedSalary;
    const jobSalary = job.salaryRange;

    if (!candidateSalary || !jobSalary) return 50;

    const { min: jobMin, max: jobMax } = jobSalary;
    
    if (candidateSalary >= jobMin && candidateSalary <= jobMax) {
      return 100;
    }

    if (candidateSalary < jobMin) {
      const diff = jobMin - candidateSalary;
      const range = jobMax - jobMin;
      return Math.max(0, 100 - (diff / range) * 100);
    }

    if (candidateSalary > jobMax) {
      const diff = candidateSalary - jobMax;
      const range = jobMax - jobMin;
      return Math.max(0, 100 - (diff / range) * 50);
    }

    return 50;
  }

  /**
   * Calculate AI-based match score using semantic analysis
   */
  async calculateAIMatch(candidate, job) {
    try {
      const prompt = `
        Analyze the match between this candidate and job description.
        
        Job:
        Title: ${job.title}
        Description: ${job.description}
        Requirements: ${job.requirements?.join(', ')}
        
        Candidate:
        Name: ${candidate.firstName} ${candidate.lastName}
        Headline: ${candidate.candidateProfile?.headline || 'N/A'}
        Summary: ${candidate.candidateProfile?.summary || 'N/A'}
        Skills: ${candidate.skills?.map(s => s.name).join(', ') || 'N/A'}
        
        Rate the match on a scale of 0-100 based on:
        1. Role alignment
        2. Cultural fit indicators
        3. Growth potential
        4. Overall suitability
        
        Return just the number.
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      });

      const scoreText = response.choices[0].message.content.trim();
      const score = parseInt(scoreText) || 50;
      
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      logger.error(`AI match scoring error: ${error.message}`);
      return 50; // Return neutral score on error
    }
  }

  /**
   * Get matched skills
   */
  getMatchedSkills(candidate, job) {
    const candidateSkills = candidate.skills?.map(s => s.name.toLowerCase()) || [];
    const requiredSkills = job.requiredSkills?.map(s => s.name.toLowerCase()) || [];

    return requiredSkills.filter(skill => 
      candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
    );
  }

  /**
   * Get missing skills
   */
  getMissingSkills(candidate, job) {
    const candidateSkills = candidate.skills?.map(s => s.name.toLowerCase()) || [];
    const requiredSkills = job.requiredSkills?.map(s => s.name.toLowerCase()) || [];

    return requiredSkills.filter(skill => 
      !candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
    );
  }

  /**
   * Get location match details
   */
  getLocationMatchDetails(candidate, job) {
    if (job.isRemote) {
      return { type: 'remote', match: true };
    }

    const candidateLocation = candidate.candidateProfile?.location || 'Unknown';
    const jobLocation = job.location || 'Unknown';

    return {
      candidateLocation,
      jobLocation,
      match: candidateLocation.toLowerCase().includes(jobLocation.toLowerCase()) ||
             jobLocation.toLowerCase().includes(candidateLocation.toLowerCase())
    };
  }

  /**
   * Get recommendation based on score
   */
  getRecommendation(score) {
    if (score >= 85) return 'highly_recommended';
    if (score >= 70) return 'recommended';
    if (score >= 55) return 'consider';
    if (score >= 40) return 'stretch';
    return 'not_recommended';
  }

  /**
   * Batch calculate matches for multiple jobs
   */
  async calculateBatchMatches(candidateId, jobIds) {
    const matches = [];
    
    for (const jobId of jobIds) {
      try {
        const match = await this.calculateMatch(candidateId, jobId);
        matches.push({ jobId, ...match });
      } catch (error) {
        logger.error(`Batch match error for job ${jobId}: ${error.message}`);
      }
    }

    // Sort by overall score descending
    return matches.sort((a, b) => b.overallScore - a.overallScore);
  }
}

export default new MatchScoringService();
