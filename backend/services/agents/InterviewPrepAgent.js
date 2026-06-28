import OpenAI from 'openai';
import config from '../../config/index.js';
import { User, Job, Interview, InterviewQuestion, InterviewSession } from '../../routes/models/index.js';
import logger from '../../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class InterviewPrepAgent {
  async execute(agent, inputData) {
    const { candidateId, jobId, interviewId } = inputData;

    try {
      const candidate = await User.findByPk(candidateId, {
        include: ['candidateProfile', 'skills']
      });

      const job = await Job.findByPk(jobId);

      if (!candidate || !job) {
        throw new Error('Candidate or job not found');
      }

      return await this.prepareForInterview(candidate, job, interviewId);
    } catch (error) {
      logger.error(`Interview prep error: ${error.message}`);
      throw error;
    }
  }

  async prepareForInterview(candidate, job, interviewId) {
    try {
      // Generate comprehensive interview preparation
      const companyResearch = await this.generateCompanyResearch(job);
      const jobAnalysis = await this.analyzeJobDescription(job);
      const techStack = await this.researchTechStack(job);
      const questions = await this.generateInterviewQuestions(candidate, job);
      const roadmap = await this.generatePreparationRoadmap(candidate, job);
      const readinessScore = this.calculateReadinessScore(candidate, job);

      // Create interview session if interviewId provided
      let interviewSession = null;
      if (interviewId) {
        interviewSession = await this.createInterviewSession(candidate.id, job.id, interviewId, questions);
      }

      return {
        companyResearch,
        jobDescriptionAnalysis: jobAnalysis,
        techStackResearch: techStack,
        interviewQuestions: questions,
        preparationRoadmap: roadmap,
        readinessScore,
        interviewSessionId: interviewSession?.id
      };
    } catch (error) {
      logger.error(`Interview preparation error: ${error.message}`);
      throw error;
    }
  }

  async generateCompanyResearch(job) {
    try {
      const prompt = `
        Research and provide insights about this company for interview preparation.
        
        Company: ${job.company || 'Not specified'}
        Industry: ${job.industry || 'Technology'}
        Job Context: ${job.title}
        
        Provide:
        - Company summary
        - Mission and values
        - Recent news/developments
        - Key products/services
        - Company culture indicators
        
        Return in JSON format:
        {
          "summary": "string",
          "mission": "string",
          "values": ["value1", "value2"],
          "recentNews": ["news1", "news2"],
          "products": ["product1", "product2"],
          "culture": "description"
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        summary: job.company || 'Company information not available',
        mission: 'Not specified',
        values: [],
        recentNews: [],
        products: [],
        culture: 'Not specified'
      };
    } catch (error) {
      logger.error(`Company research error: ${error.message}`);
      return {};
    }
  }

  async analyzeJobDescription(job) {
    try {
      const requirements = job.requirements || [];
      const skills = job.skills || [];

      return {
        keyRequirements: requirements,
        responsibilities: this.extractResponsibilities(job.description),
        keywords: [...requirements, ...skills],
        experienceLevel: job.experienceLevel,
        requiredSkills: skills
      };
    } catch (error) {
      logger.error(`Job analysis error: ${error.message}`);
      return {};
    }
  }

  extractResponsibilities(description) {
    if (!description) return [];
    
    const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  async researchTechStack(job) {
    try {
      const description = job.description || '';
      const requirements = job.requirements || [];
      
      const techKeywords = [...requirements, ...description.match(/\b(?:JavaScript|TypeScript|React|Angular|Vue|Node\.js|Python|Java|Go|Rust|AWS|Azure|GCP|Docker|Kubernetes|PostgreSQL|MongoDB|Redis|GraphQL|REST|Microservices)\b/gi) || []];
      
      const uniqueTech = [...new Set(techKeywords.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()))];
      
      return {
        frontend: uniqueTech.filter(t => ['React', 'Angular', 'Vue', 'JavaScript', 'TypeScript'].includes(t)),
        backend: uniqueTech.filter(t => ['Node.js', 'Python', 'Java', 'Go', 'Rust'].includes(t)),
        databases: uniqueTech.filter(t => ['PostgreSQL', 'MongoDB', 'Redis'].includes(t)),
        cloud: uniqueTech.filter(t => ['AWS', 'Azure', 'GCP'].includes(t)),
        devops: uniqueTech.filter(t => ['Docker', 'Kubernetes'].includes(t)),
        other: uniqueTech.filter(t => !['React', 'Angular', 'Vue', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis'].includes(t))
      };
    } catch (error) {
      logger.error(`Tech stack research error: ${error.message}`);
      return {};
    }
  }

  async generateInterviewQuestions(candidate, job) {
    try {
      const candidateSkills = candidate.skills?.map(s => s.name).join(', ') || '';
      const candidateProfile = candidate.candidateProfile?.summary || '';
      
      const prompt = `
        Generate 10-15 interview questions for this candidate based on the job requirements.
        
        Job Title: ${job.title}
        Job Description: ${job.description}
        Requirements: ${job.requirements?.join(', ')}
        
        Candidate Skills: ${candidateSkills}
        Candidate Profile: ${candidateProfile}
        
        Include:
        - Behavioral questions (STAR method)
        - Technical questions
        - System design questions (if applicable)
        - Culture fit questions
        
        For each question, provide:
        - The question
        - Key points to cover in answer
        - Difficulty level (easy/medium/hard)
        
        Return in JSON format:
        {
          "questions": [
            {
              "question": "string",
              "keyPoints": ["point1", "point2"],
              "type": "behavioral|technical|system|culture",
              "difficulty": "easy|medium|hard"
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
      
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
      return result.questions || [];
    } catch (error) {
      logger.error(`Question generation error: ${error.message}`);
      return [];
    }
  }

  async generatePreparationRoadmap(candidate, job) {
    try {
      const candidateSkills = candidate.skills?.map(s => s.name) || [];
      const jobRequirements = job.requirements || [];
      
      const missingSkills = jobRequirements.filter(req => 
        !candidateSkills.some(cs => cs.toLowerCase().includes(req.toLowerCase()))
      );

      const prompt = `
        Create a 2-week interview preparation roadmap for this candidate.
        
        Job: ${job.title}
        Missing Skills: ${missingSkills.join(', ') || 'None'}
        Current Skills: ${candidateSkills.join(', ')}
        
        Provide daily tasks including:
        - Topics to study
        - Practice exercises
        - Mock interview topics
        - Resources to review
        
        Return in JSON format:
        {
          "roadmap": [
            {
              "day": 1,
              "topics": ["topic1", "topic2"],
              "practice": "exercise description",
              "resources": ["resource1"]
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
      
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { roadmap: [] };
      return result.roadmap || [];
    } catch (error) {
      logger.error(`Roadmap generation error: ${error.message}`);
      return [];
    }
  }

  calculateReadinessScore(candidate, job) {
    const candidateSkills = candidate.skills?.map(s => s.name.toLowerCase()) || [];
    const jobRequirements = job.requirements?.map(r => r.toLowerCase()) || [];
    
    const matchedSkills = jobRequirements.filter(req => 
      candidateSkills.some(cs => cs.includes(req) || req.includes(cs))
    );
    
    const skillMatch = jobRequirements.length > 0 
      ? (matchedSkills.length / jobRequirements.length) * 100 
      : 50;
    
    const experienceBonus = candidate.candidateProfile?.experienceLevel === job.experienceLevel ? 10 : 0;
    
    return Math.min(100, Math.round(skillMatch + experienceBonus));
  }

  async createInterviewSession(candidateId, jobId, interviewId, questions) {
    try {
      const session = await InterviewSession.create({
        candidateId,
        jobId,
        interviewId,
        status: 'preparation',
        startedAt: new Date()
      });

      // Create interview questions
      for (const question of questions.slice(0, 10)) {
        await InterviewQuestion.create({
          interviewSessionId: session.id,
          question: question.question,
          type: question.type,
          difficulty: question.difficulty,
          keyPoints: question.keyPoints,
          answer: null
        });
      }

      return session;
    } catch (error) {
      logger.error(`Interview session creation error: ${error.message}`);
      return null;
    }
  }
}

export default InterviewPrepAgent;
