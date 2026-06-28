import OpenAI from 'openai';
import config from '../../config/index.js';
import { CoverLetter, Job, User } from '../../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class CoverLetterAgent {
  async execute(agent, inputData) {
    const { jobId, candidateId } = inputData;
    
    const job = await Job.findByPk(jobId);
    const user = await User.findByPk(candidateId || agent.candidateId, {
      include: ['candidateProfile']
    });

    if (!job || !user) {
      throw new Error('Job or user not found');
    }

    const letterContent = await this.generateCoverLetter(user, job);
    
    const coverLetter = await CoverLetter.create({
      candidateId: user.id,
      jobId: job.id,
      title: `Cover Letter for ${job.title} at ${job.company || 'Company'}`,
      content: letterContent,
      aiGenerated: true,
      aiScore: 85
    });

    return { coverLetter: coverLetter.toJSON() };
  }

  async generateCoverLetter(user, job) {
    const prompt = `
      Write a professional, compelling cover letter for the following job.
      
      Job Title: ${job.title}
      Company: ${job.company || 'Company'}
      Job Description: ${job.description}
      
      Candidate Info:
      Name: ${user.firstName} ${user.lastName}
      Email: ${user.email}
      ${user.candidateProfile?.headline ? `Headline: ${user.candidateProfile.headline}` : ''}
      ${user.candidateProfile?.summary ? `Summary: ${user.candidateProfile.summary}` : ''}
      
      Requirements:
      - Be professional but personal
      - Highlight relevant skills and experience
      - Show enthusiasm for the role
      - Keep it to 3-4 paragraphs
      - Do not use placeholders like [Company Name]
    `;

    const response = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    });

    return response.choices[0].message.content;
  }
}

export default CoverLetterAgent;
