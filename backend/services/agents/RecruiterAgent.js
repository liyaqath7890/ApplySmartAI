import OpenAI from 'openai';
import config from '../../config/index.js';
import { User, Recruiter, RecruiterInteraction, Job } from '../../routes/models/index.js';
import logger from '../../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class RecruiterAgent {
  async execute(agent, inputData) {
    const { candidateId, recruiterId } = inputData;

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

      return await this.analyzeRecruiter(candidate, recruiterId);
    } catch (error) {
      logger.error(`Recruiter analysis error: ${error.message}`);
      throw error;
    }
  }

  async analyzeRecruiter(candidate, recruiterId) {
    try {
      const recruiter = await Recruiter.findByPk(recruiterId);
      if (!recruiter) {
        throw new Error('Recruiter not found');
      }

      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];

      // Generate recruiter analysis
      const outreachStrategy = await this.generateOutreachStrategy(candidate, recruiter);
      const messageTemplate = await this.generateOutreachMessage(candidate, recruiter);
      const interactionTips = await this.generateInteractionTips(candidate, recruiter);
      const timingRecommendations = await this.analyzeTiming(candidate, recruiter);

      // Create or update recruiter interaction record
      const interaction = await RecruiterInteraction.create({
        candidateId: candidate.id,
        recruiterId: recruiter.id,
        status: 'identified',
        outreachStrategy,
        messageTemplate,
        interactionTips,
        timingRecommendations,
        lastContacted: null,
        followUpDate: timingRecommendations.optimalDate
      });

      return {
        recruiter: {
          id: recruiter.id,
          name: recruiter.name,
          company: recruiter.company,
          role: recruiter.role,
          specialization: recruiter.specialization
        },
        outreachStrategy,
        messageTemplate,
        interactionTips,
        timingRecommendations,
        interactionId: interaction.id
      };
    } catch (error) {
      logger.error(`Recruiter analysis error: ${error.message}`);
      throw error;
    }
  }

  async generateOutreachStrategy(candidate, recruiter) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];

      const prompt = `
        Generate an outreach strategy for contacting this recruiter.
        
        Candidate Profile:
        - Name: ${candidate.firstName} ${candidate.lastName}
        - Current Role: ${profile?.headline || 'Not specified'}
        - Skills: ${skills.join(', ')}
        - Career Goal: ${profile?.careerGoal || 'Not specified'}
        
        Recruiter Profile:
        - Name: ${recruiter.name}
        - Company: ${recruiter.company}
        - Role: ${recruiter.role}
        - Specialization: ${recruiter.specialization || 'Not specified'}
        
        Provide:
        - Best approach (email, LinkedIn, etc.)
        - Personalization angles
        - Value proposition
        - Follow-up strategy
        - Key talking points
        
        Return in JSON format:
        {
          "approach": "email|linkedin|phone",
          "personalizationAngles": ["angle1", "angle2"],
          "valueProposition": "value prop",
          "followUpStrategy": "strategy",
          "talkingPoints": ["point1", "point2"]
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
      logger.error(`Outreach strategy error: ${error.message}`);
      return {};
    }
  }

  async generateOutreachMessage(candidate, recruiter) {
    try {
      const profile = candidate.candidateProfile;
      const skills = candidate.skills?.map(s => s.name) || [];

      const prompt = `
        Generate a personalized outreach message to this recruiter.
        
        Candidate: ${candidate.firstName} ${candidate.lastName}
        Current Role: ${profile?.headline || 'Not specified'}
        Key Skills: ${skills.join(', ')}
        
        Recruiter: ${recruiter.name} at ${recruiter.company}
        Role: ${recruiter.role}
        
        Create a professional, personalized message that:
        - Is concise (under 200 words)
        - Shows genuine interest
        - Highlights relevant experience
        - Includes a clear call-to-action
        - Avoids generic templates
        
        Return in JSON format:
        {
          "subject": "email subject line",
          "body": "message body",
          "callToAction": "specific CTA"
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      logger.error(`Message generation error: ${error.message}`);
      return {};
    }
  }

  async generateInteractionTips(candidate, recruiter) {
    try {
      const prompt = `
        Provide tips for interacting with this recruiter.
        
        Recruiter: ${recruiter.name} at ${recruiter.company}
        Role: ${recruiter.role}
        
        Provide:
        - Best times to contact
        - Communication style preferences
        - Topics to avoid
        - Topics to emphasize
        - Red flags to watch for
        
        Return in JSON format:
        {
          "bestTimes": ["time1", "time2"],
          "communicationStyle": "style description",
          "avoidTopics": ["topic1", "topic2"],
          "emphasizeTopics": ["topic1", "topic2"],
          "redFlags": ["flag1", "flag2"]
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
      logger.error(`Interaction tips error: ${error.message}`);
      return {};
    }
  }

  async analyzeTiming(candidate, recruiter) {
    try {
      const now = new Date();
      const optimalDate = new Date(now);
      optimalDate.setDate(optimalDate.getDate() + 3); // Default to 3 days out

      return {
        optimalDate: optimalDate.toISOString().split('T')[0],
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: ['10:00 AM', '2:00 PM'],
        avoidDays: ['Monday', 'Friday'],
        reason: 'Mid-week mornings typically have higher response rates'
      };
    } catch (error) {
      logger.error(`Timing analysis error: ${error.memory}`);
      return {};
    }
  }
}

export default RecruiterAgent;
