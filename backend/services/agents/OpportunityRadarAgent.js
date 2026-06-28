import OpenAI from 'openai';
import config from '../../config/index.js';
import { User, Job, ExternalJob, Skill } from '../../routes/models/index.js';
import logger from '../../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class OpportunityRadarAgent {
  async execute(agent, inputData) {
    const { candidateId, preferences } = inputData;

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

      return await this.scanOpportunities(candidate, preferences);
    } catch (error) {
      logger.error(`Opportunity radar scan error: ${error.message}`);
      throw error;
    }
  }

  async scanOpportunities(candidate, preferences) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];

      // Generate comprehensive opportunity insights
      const trendingSkills = await this.identifyTrendingSkills(skills);
      const emergingTechnologies = await this.identifyEmergingTechnologies(skills);
      const hiringSurges = await this.identifyHiringSurges(profile);
      const marketInsights = await this.generateMarketInsights(candidate, preferences);
      const opportunityScore = this.calculateOpportunityScore(candidate, marketInsights);

      return {
        trendingSkills,
        emergingTechnologies,
        hiringSurges,
        marketInsights,
        opportunityScore,
        recommendations: await this.generateRecommendations(candidate, marketInsights),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Opportunity scan error: ${error.message}`);
      throw error;
    }
  }

  async identifyTrendingSkills(currentSkills) {
    try {
      const prompt = `
        Identify trending skills in the job market based on these current skills.
        
        Current Skills: ${currentSkills.join(', ')}
        
        Provide:
        - Skills that are trending upward
        - Skills with high demand
        - Skills becoming essential
        - Skills with declining demand
        
        Return in JSON format:
        {
          "trendingUp": ["skill1", "skill2"],
          "highDemand": ["skill1", "skill2"],
          "becomingEssential": ["skill1", "skill2"],
          "declining": ["skill1", "skill2"]
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
      logger.error(`Trending skills error: ${error.message}`);
      return {};
    }
  }

  async identifyEmergingTechnologies(currentSkills) {
    try {
      const prompt = `
        Identify emerging technologies that complement these skills.
        
        Current Skills: ${currentSkills.join(', ')}
        
        Provide:
        - Emerging technologies to watch
        - Technologies gaining traction
        - Future-proof technologies
        - Estimated adoption timeline
        
        Return in JSON format:
        {
          "toWatch": ["tech1", "tech2"],
          "gainingTraction": ["tech1", "tech2"],
          "futureProof": ["tech1", "tech2"],
          "timeline": {
            "nearTerm": ["tech1"],
            "midTerm": ["tech2"],
            "longTerm": ["tech3"]
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
      logger.error(`Emerging technologies error: ${error.message}`);
      return {};
    }
  }

  async identifyHiringSurges(profile) {
    try {
      const industry = profile?.industry || 'Technology';
      const location = profile?.location || 'Remote';

      const prompt = `
        Identify industries and sectors experiencing hiring surges.
        
        Industry: ${industry}
        Location: ${location}
        
        Provide:
        - Industries with hiring surges
        - Sectors with growth
        - Companies actively hiring
        - Geographic hotspots
        
        Return in JSON format:
        {
          "industries": ["industry1", "industry2"],
          "sectors": ["sector1", "sector2"],
          "hotCompanies": ["company1", "company2"],
          "hotspots": ["location1", "location2"]
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
      logger.error(`Hiring surges error: ${error.message}`);
      return {};
    }
  }

  async generateMarketInsights(candidate, preferences) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];

      const prompt = `
        Generate comprehensive market insights for this candidate.
        
        Candidate Profile:
        - Current Role: ${profile?.headline || 'Not specified'}
        - Skills: ${skills.join(', ')}
        - Location: ${profile?.location || 'Not specified'}
        - Career Goal: ${profile?.careerGoal || 'Not specified'}
        
        Preferences: ${JSON.stringify(preferences || {})}
        
        Provide:
        - Remote opportunity percentage
        - Startup opportunity percentage
        - Enterprise opportunity percentage
        - Salary trends
        - Market demand level
        - Competition level
        
        Return in JSON format:
        {
          "remoteOpportunities": 75,
          "startupOpportunities": 40,
          "enterpriseOpportunities": 85,
          "salaryTrends": "increasing|stable|decreasing",
          "marketDemand": "high|medium|low",
          "competitionLevel": "high|medium|low"
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
      logger.error(`Market insights error: ${error.message}`);
      return {};
    }
  }

  calculateOpportunityScore(candidate, marketInsights) {
    let score = 50;
    
    // Adjust based on market demand
    if (marketInsights.marketDemand === 'high') score += 20;
    if (marketInsights.marketDemand === 'medium') score += 10;
    
    // Adjust based on remote opportunities
    if (marketInsights.remoteOpportunities > 60) score += 10;
    
    // Adjust based on salary trends
    if (marketInsights.salaryTrends === 'increasing') score += 10;
    
    // Adjust based on competition
    if (marketInsights.competitionLevel === 'low') score += 10;
    
    return Math.min(100, score);
  }

  async generateRecommendations(candidate, marketInsights) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];

      const prompt = `
        Generate actionable recommendations based on market insights.
        
        Current Skills: ${skills.join(', ')}
        Market Insights: ${JSON.stringify(marketInsights)}
        
        Provide:
        - Skills to prioritize learning
        - Industries to target
        - Companies to research
        - Actions to take this month
        
        Return in JSON format:
        {
          "skillsToLearn": ["skill1", "skill2"],
          "industriesToTarget": ["industry1", "industry2"],
          "companiesToResearch": ["company1", "company2"],
          "immediateActions": ["action1", "action2"]
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
      logger.error(`Recommendations error: ${error.message}`);
      return {};
    }
  }
}

export default OpportunityRadarAgent;
