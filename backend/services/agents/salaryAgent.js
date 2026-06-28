import OpenAI from 'openai';
import config from '../../config/index.js';
import { Job, User } from '../../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class SalaryAgent {
  async execute(agent, inputData) {
    const { jobId, candidateId, location, experience } = inputData;
    
    const job = jobId ? await Job.findByPk(jobId) : null;
    const user = candidateId ? await User.findByPk(candidateId, { include: ['candidateProfile'] }) : null;

    const analysis = await this.analyzeSalary(job, user, location, experience);
    return analysis;
  }

  async analyzeSalary(job, user, location, experience) {
    const prompt = `
      Provide salary analysis and negotiation tips.
      
      ${job ? `Job Title: ${job.title}\nCompany: ${job.company || 'Unknown'}` : 'General market rate'}
      Location: ${location || 'Not specified'}
      Experience: ${experience || 'Not specified'}
      ${user?.candidateProfile?.experience ? `Candidate Experience: ${user.candidateProfile.experience} years` : ''}
      
      Return JSON with:
      {
        marketRange: { min: number, max: number, currency: 'USD' },
        candidateTarget: number,
        negotiationTips: [string],
        benefitsToConsider: [string],
        factors: {
          location: 'high'|'medium'|'low',
          experience: 'high'|'medium'|'low',
          demand: 'high'|'medium'|'low'
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
    return jsonMatch ? JSON.parse(jsonMatch[0]) : content;
  }
}

export default SalaryAgent;
