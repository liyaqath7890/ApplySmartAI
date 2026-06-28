import OpenAI from 'openai';
import config from '../../config/index.js';
import { Job, SkillGap, User } from '../../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class JobAnalysisAgent {
  async execute(agent, inputData) {
    const { jobId, candidateId } = inputData;
    
    const job = await Job.findByPk(jobId);
    const user = await User.findByPk(candidateId || agent.candidateId, {
      include: ['skills']
    });

    if (!job || !user) {
      throw new Error('Job or user not found');
    }

    const analysis = await this.analyzeJob(user, job);
    return { analysis, job: job.toJSON() };
  }

  async analyzeJob(user, job) {
    const prompt = `
      Analyze this job posting and provide insights.
      
      Job Title: ${job.title}
      Job Description: ${job.description}
      Job Requirements: ${job.requirements?.join(', ')}
      
      Candidate Skills: ${user.skills?.map(s => s.name).join(', ') || 'Not specified'}
      
      Return a JSON with:
      {
        keySkills: [string],
        experienceLevel: 'entry'|'mid'|'senior'|'lead'|'executive',
        salaryRange: { min: number, max: number },
        culture: string,
        growthPotential: 'low'|'medium'|'high',
        matchScore: 0-100
      }
    `;

    const response = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : content;
  }
}

export default JobAnalysisAgent;
