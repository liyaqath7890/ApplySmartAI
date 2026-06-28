import OpenAI from 'openai';
import config from '../../config/index.js';
import { Resume, ResumeVersion, Job, User } from '../../routes/models/index.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class ResumeAgent {
  async execute(agent, inputData) {
    const { jobId, candidateId } = inputData;
    
    const job = await Job.findByPk(jobId);
    const user = await User.findByPk(candidateId || agent.candidateId, {
      include: ['candidateProfile']
    });
    const primaryResume = await Resume.findOne({
      where: { candidateId: user.id, isPrimary: true }
    });

    if (!job || !user) {
      throw new Error('Job or user not found');
    }

    const resumeContent = await this.generateTailoredResume(user, job, primaryResume);
    
    const version = await ResumeVersion.create({
      resumeId: primaryResume?.id,
      versionNumber: 1,
      title: `Tailored for ${job.title}`,
      content: resumeContent,
      atsScore: await this.calculateATSScore(resumeContent, job),
      isCurrent: true,
      jobId: job.id
    });

    return { version: version.toJSON(), atsScore: version.atsScore };
  }

  async generateTailoredResume(user, job, existingResume) {
    const prompt = `
      Generate a professional resume tailored for the following job.
      
      Job Title: ${job.title}
      Job Description: ${job.description}
      Job Requirements: ${job.requirements?.join(', ')}
      
      Candidate Info:
      Name: ${user.firstName} ${user.lastName}
      Email: ${user.email}
      ${user.candidateProfile?.headline ? `Headline: ${user.candidateProfile.headline}` : ''}
      ${user.candidateProfile?.summary ? `Summary: ${user.candidateProfile.summary}` : ''}
      
      ${existingResume?.parsedContent ? `Existing Resume Data: ${JSON.stringify(existingResume.parsedContent)}` : ''}
      
      Return the resume strictly in JSON format with the following structure:
      {
        "personal": { "name": "", "email": "", "phone": "", "location": "" },
        "summary": "",
        "skills": [""],
        "experience": [{ "title": "", "company": "", "duration": "", "description": "" }],
        "education": [{ "degree": "", "school": "", "year": "" }],
        "certifications": [{ "name": "", "issuer": "", "year": "" }]
      }
    `;

    const response = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }

  async calculateATSScore(resumeContent, job) {
    const ATSScoringService = (await import('../ATSScoringService.js')).default;
    const result = await ATSScoringService.calculateATSScore({ content: JSON.stringify(resumeContent) }, job);
    return result.overallScore || 0;
  }
}

export default ResumeAgent;
