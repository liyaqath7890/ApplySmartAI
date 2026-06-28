import OpenAI from 'openai';
import config from '../config/index.js';
import { User, WorkExperience, Skill, JobPrediction, Job } from '../routes/models/index.js';
import logger from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class CareerPredictionService {
  /**
   * Predict career trajectory for a candidate
   */
  async predictCareer(candidateId) {
    try {
      const candidate = await User.findByPk(candidateId, {
        include: [
          { model: Skill, as: 'skills' },
          { model: CandidateProfile, as: 'candidateProfile' },
          { model: WorkExperience, as: 'workExperience' }
        ]
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Analyze current position
      const currentPosition = this.analyzeCurrentPosition(candidate);
      
      // Predict next roles
      const nextRoles = await this.predictNextRoles(candidate);
      
      // Predict long-term trajectory
      const longTermTrajectory = await this.predictLongTermTrajectory(candidate);
      
      // Identify skill development needs
      const skillDevelopment = await this.identifySkillDevelopment(candidate);
      
      // Market demand analysis
      const marketDemand = await this.analyzeMarketDemand(candidate);

      const prediction = {
        currentPosition,
        nextRoles,
        longTermTrajectory,
        skillDevelopment,
        marketDemand,
        confidence: this.calculateConfidence(candidate),
        timestamp: new Date().toISOString()
      };

      // Store prediction
      await this.storePrediction(candidateId, prediction);

      return prediction;
    } catch (error) {
      logger.error(`Career prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze current position
   */
  analyzeCurrentPosition(candidate) {
    const profile = candidate.candidateProfile;
    const experience = candidate.workExperience || [];
    const latestRole = experience[0];

    return {
      title: latestRole?.title || profile?.headline || 'Not specified',
      level: this.determineCareerLevel(experience),
      yearsOfExperience: this.calculateTotalExperience(experience),
      industry: this.extractIndustry(experience),
      keySkills: candidate.skills?.slice(0, 5).map(s => s.name) || []
    };
  }

  /**
   * Determine career level
   */
  determineCareerLevel(experience) {
    const totalYears = this.calculateTotalExperience(experience);
    
    if (totalYears < 1) return 'Entry Level';
    if (totalYears < 3) return 'Junior';
    if (totalYears < 5) return 'Mid-Level';
    if (totalYears < 8) return 'Senior';
    if (totalYears < 12) return 'Lead/Principal';
    return 'Executive/Director';
  }

  /**
   * Calculate total years of experience
   */
  calculateTotalExperience(experience) {
    if (!experience || experience.length === 0) return 0;

    return experience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
  }

  /**
   * Extract industry from experience
   */
  extractIndustry(experience) {
    if (!experience || experience.length === 0) return 'Unknown';
    
    const industries = experience
      .map(exp => exp.company || exp.industry)
      .filter(Boolean);
    
    return industries[0] || 'Unknown';
  }

  /**
   * Predict next career roles using AI
   */
  async predictNextRoles(candidate) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name).join(', ') || '';
      const experience = candidate.workExperience?.map(e => e.title).join(', ') || '';

      const prompt = `
        Based on this candidate's profile, predict the next 3 most likely career roles they should pursue.
        
        Current Profile:
        - Headline: ${profile?.headline || 'N/A'}
        - Summary: ${profile?.summary || 'N/A'}
        - Skills: ${skills}
        - Past Roles: ${experience}
        
        For each predicted role, provide:
        - Role title
        - Probability (0-100)
        - Time to reach (in months)
        - Required skills to acquire
        - Why this role fits
        
        Return in JSON format:
        {
          "roles": [
            {
              "title": "role title",
              "probability": 85,
              "timeToReach": "6-12 months",
              "requiredSkills": ["skill1", "skill2"],
              "rationale": "explanation"
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
      
      return jsonMatch ? JSON.parse(jsonMatch[0]).roles : [];
    } catch (error) {
      logger.error(`Next roles prediction error: ${error.message}`);
      return [];
    }
  }

  /**
   * Predict long-term career trajectory
   */
  async predictLongTermTrajectory(candidate) {
    try {
      const skills = candidate.skills?.map(s => s.name).join(', ') || '';
      const experience = candidate.workExperience?.map(e => `${e.title} at ${e.company}`).join(', ') || '';

      const prompt = `
        Predict the long-term career trajectory (5-10 years) for this candidate.
        
        Skills: ${skills}
        Experience: ${experience}
        
        Provide:
        - 5-year projection
        - 10-year projection
        - Potential leadership paths
        - Industry evolution considerations
        
        Return in JSON format:
        {
          "fiveYearProjection": "description",
          "tenYearProjection": "description",
          "leadershipPaths": ["path1", "path2"],
          "industryConsiderations": ["consideration1", "consideration2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      logger.error(`Long-term trajectory prediction error: ${error.message}`);
      return {};
    }
  }

  /**
   * Identify skill development needs
   */
  async identifySkillDevelopment(candidate) {
    try {
      const skills = candidate.skills?.map(s => s.name).join(', ') || '';
      const profile = candidate.candidateProfile;

      const prompt = `
        Identify skill development priorities for this candidate to advance their career.
        
        Current Skills: ${skills}
        Career Goal: ${profile?.careerGoal || 'Not specified'}
        
        Provide:
        - Critical skills to learn (next 6 months)
        - Important skills to develop (next 1-2 years)
        - Nice-to-have skills (long-term)
        - Skills to deepen/advance
        
        Return in JSON format:
        {
          "critical": ["skill1", "skill2"],
          "important": ["skill3", "skill4"],
          "niceToHave": ["skill5", "skill6"],
          "toDeepen": ["skill7", "skill8"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      logger.error(`Skill development identification error: ${error.message}`);
      return {};
    }
  }

  /**
   * Analyze market demand for candidate's skills
   */
  async analyzeMarketDemand(candidate) {
    try {
      const skills = candidate.skills?.map(s => s.name).join(', ') || '';
      const experience = candidate.workExperience?.map(e => e.title).join(', ') || '';

      const prompt = `
        Analyze the current market demand for this candidate's skill set.
        
        Skills: ${skills}
        Experience: ${experience}
        
        Provide:
        - Overall demand level (high/medium/low)
        - In-demand skills from their profile
        - Emerging trends in their field
        - Geographic hotspots
        - Salary market trends
        
        Return in JSON format:
        {
          "demandLevel": "high|medium|low",
          "inDemandSkills": ["skill1", "skill2"],
          "emergingTrends": ["trend1", "trend2"],
          "geographicHotspots": ["location1", "location2"],
          "salaryTrends": "description"
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      logger.error(`Market demand analysis error: ${error.message}`);
      return {};
    }
  }

  /**
   * Calculate prediction confidence based on data quality
   */
  calculateConfidence(candidate) {
    let confidence = 50;
    
    // Has skills
    if (candidate.skills && candidate.skills.length > 0) {
      confidence += 15;
    }
    
    // Has work experience
    if (candidate.workExperience && candidate.workExperience.length > 0) {
      confidence += 20;
    }
    
    // Has profile
    if (candidate.candidateProfile) {
      confidence += 10;
    }
    
    // Has detailed profile
    if (candidate.candidateProfile?.summary && candidate.candidateProfile?.headline) {
      confidence += 5;
    }

    return Math.min(100, confidence);
  }

  /**
   * Store prediction in database
   */
  async storePrediction(candidateId, prediction) {
    try {
      await JobPrediction.create({
        candidateId,
        predictionData: prediction,
        confidence: prediction.confidence,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      });
    } catch (error) {
      logger.error(`Error storing prediction: ${error.message}`);
    }
  }

  /**
   * Get latest prediction for candidate
   */
  async getLatestPrediction(candidateId) {
    try {
      const prediction = await JobPrediction.findOne({
        where: {
          candidateId,
          validUntil: { [Op.gte]: new Date() }
        },
        order: [['createdAt', 'DESC']]
      });

      return prediction ? prediction.predictionData : null;
    } catch (error) {
      logger.error(`Error retrieving prediction: ${error.message}`);
      return null;
    }
  }

  /**
   * Compare candidate's actual progression with predictions
   */
  async compareWithPrediction(candidateId) {
    try {
      const prediction = await this.getLatestPrediction(candidateId);
      if (!prediction) {
        return { message: 'No valid prediction found' };
      }

      const candidate = await User.findByPk(candidateId, {
        include: [
          { model: WorkExperience, as: 'workExperience' }
        ]
      });

      // Compare current role with predicted next roles
      const currentRole = candidate.workExperience[0]?.title;
      const predictedRoles = prediction.nextRoles || [];
      
      const match = predictedRoles.find(role => 
        currentRole?.toLowerCase().includes(role.title.toLowerCase())
      );

      return {
        currentRole,
        predictedRoles,
        matchFound: !!match,
        matchDetails: match || null,
        predictionAccuracy: match ? 'accurate' : 'deviated'
      };
    } catch (error) {
      logger.error(`Comparison error: ${error.message}`);
      return null;
    }
  }
}

export default new CareerPredictionService();
