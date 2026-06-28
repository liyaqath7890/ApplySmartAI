import OpenAI from 'openai';
import config from '../../config/index.js';
import { User, CareerTwin, Skill, Application, Interview } from '../../routes/models/index.js';
import logger from '../../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class CareerTwinAgent {
  async execute(agent, inputData) {
    const { candidateId } = inputData;

    try {
      const candidate = await User.findByPk(candidateId, {
        include: [
          'candidateProfile',
          'skills',
          'workExperience',
          'education'
        ]
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      return await this.generateCareerTwin(candidate);
    } catch (error) {
      logger.error(`Career twin generation error: ${error.message}`);
      throw error;
    }
  }

  async generateCareerTwin(candidate) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];
      const experience = candidate.workExperience || [];
      const education = candidate.education || [];

      // Generate AI-powered career twin analysis
      const careerAnalysis = await this.analyzeCareerTrajectory(candidate);
      const weaknessAnalysis = await this.analyzeWeaknesses(candidate);
      const growthRecommendations = await this.generateGrowthRecommendations(candidate);
      const skillGapAnalysis = await this.analyzeSkillGaps(candidate);
      const marketPositioning = await this.analyzeMarketPositioning(candidate);

      // Create or update career twin record
      const careerTwin = await CareerTwin.upsert({
        candidateId: candidate.id,
        careerStage: careerAnalysis.stage,
        currentLevel: careerAnalysis.level,
        targetLevel: careerAnalysis.targetLevel,
        strengths: weaknessAnalysis.strengths,
        weaknesses: weaknessAnalysis.weaknesses,
        growthAreas: growthRecommendations.areas,
        recommendedActions: growthRecommendations.actions,
        marketScore: marketPositioning.score,
        marketInsights: marketPositioning.insights,
        lastUpdated: new Date()
      });

      return {
        careerAnalysis,
        weaknessAnalysis,
        growthRecommendations,
        skillGapAnalysis,
        marketPositioning,
        careerTwinId: careerTwin[0]?.id
      };
    } catch (error) {
      logger.error(`Career twin error: ${error.message}`);
      throw error;
    }
  }

  async analyzeCareerTrajectory(candidate) {
    try {
      const profile = candidate.candidateProfile;
      const experience = candidate.workExperience || [];
      const totalYears = experience.reduce((sum, exp) => {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        return sum + ((end - start) / (1000 * 60 * 60 * 24 * 365));
      }, 0);

      const prompt = `
        Analyze this candidate's career trajectory and provide insights.
        
        Current Role: ${experience[0]?.title || 'Not specified'}
        Total Experience: ${totalYears.toFixed(1)} years
        Career Goal: ${profile?.careerGoal || 'Not specified'}
        Headline: ${profile?.headline || 'Not specified'}
        
        Provide:
        - Current career stage
        - Current level
        - Target level (realistic next step)
        - Time to reach target
        - Career path recommendations
        
        Return in JSON format:
        {
          "stage": "early|mid|late",
          "level": "junior|mid|senior|lead|executive",
          "targetLevel": "next_level",
          "timeToTarget": "time estimate",
          "paths": ["path1", "path2"]
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
      logger.error(`Career trajectory analysis error: ${error.message}`);
      return {};
    }
  }

  async analyzeWeaknesses(candidate) {
    try {
      const skills = candidate.skills?.map(s => s.name) || [];
      const experience = candidate.workExperience || [];

      const prompt = `
        Analyze this candidate's weaknesses and areas for improvement.
        
        Skills: ${skills.join(', ')}
        Experience: ${experience.map(e => e.title).join(', ')}
        
        Identify:
        - Technical weaknesses
        - Soft skill gaps
        - Experience gaps
        - Strengths to leverage
        
        Return in JSON format:
        {
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "technicalGaps": ["gap1", "gap2"],
          "softSkillGaps": ["gap1", "gap2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { strengths: [], weaknesses: [] };
    } catch (error) {
      logger.error(`Weakness analysis error: ${error.message}`);
      return { strengths: [], weaknesses: [] };
    }
  }

  async generateGrowthRecommendations(candidate) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];

      const prompt = `
        Generate personalized growth recommendations for this candidate.
        
        Career Goal: ${profile?.careerGoal || 'Not specified'}
        Current Skills: ${skills.join(', ')}
        
        Provide:
        - Key growth areas
        - Specific actionable recommendations
        - Timeline for each recommendation
        - Resources to use
        
        Return in JSON format:
        {
          "areas": ["area1", "area2"],
          "actions": [
            {
              "action": "specific action",
              "timeline": "time estimate",
              "resources": ["resource1", "resource2"]
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { areas: [], actions: [] };
    } catch (error) {
      logger.error(`Growth recommendations error: ${error.message}`);
      return { areas: [], actions: [] };
    }
  }

  async analyzeSkillGaps(candidate) {
    try {
      const skills = candidate.skills?.map(s => s.name) || [];
      const profile = candidate.candidateProfile;

      const prompt = `
        Analyze skill gaps for this candidate based on market demands.
        
        Current Skills: ${skills.join(', ')}
        Career Goal: ${profile?.careerGoal || 'Not specified'}
        
        Identify:
        - Missing critical skills
        - Skills to deepen
        - Emerging skills to learn
        - Priority level for each
        
        Return in JSON format:
        {
          "missingCritical": ["skill1", "skill2"],
          "toDeepen": ["skill1", "skill2"],
          "emerging": ["skill1", "skill2"],
          "priorities": {
            "high": ["skill1"],
            "medium": ["skill2"],
            "low": ["skill3"]
          }
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
      logger.error(`Skill gap analysis error: ${error.message}`);
      return {};
    }
  }

  async analyzeMarketPositioning(candidate) {
    try {
      const skills = candidate.skills?.map(s => s.name) || [];
      const experience = candidate.workExperience || [];

      const prompt = `
        Analyze this candidate's market positioning.
        
        Skills: ${skills.join(', ')}
        Experience: ${experience.map(e => `${e.title} at ${e.company}`).join(', ')}
        
        Provide:
        - Market score (0-100)
        - Competitive advantages
        - Market insights
        - Differentiation strategy
        
        Return in JSON format:
        {
          "score": 75,
          "advantages": ["advantage1", "advantage2"],
          "insights": ["insight1", "insight2"],
          "differentiation": "strategy description"
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 50, advantages: [], insights: [] };
    } catch (error) {
      logger.error(`Market positioning error: ${error.message}`);
      return { score: 50, advantages: [], insights: [] };
    }
  }
}

export default CareerTwinAgent;
