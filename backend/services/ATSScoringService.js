import OpenAI from 'openai';
import config from '../config/index.js';
import { Resume, Job, ResumeVersion } from '../routes/models/index.js';
import logger from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class ATSScoringService {
  /**
   * Calculate ATS score for a resume against a job
   */
  async calculateATSScore(resume, job) {
    try {
      const resumeText = this.extractResumeText(resume);
      const jobText = this.extractJobText(job);
      
      const systemPrompt = `You are an expert Applicant Tracking System (ATS) and Technical Recruiter.
      Evaluate the provided resume text against the provided job description.
      You must strictly return JSON matching this schema:
      {
        "overallScore": 85,
        "keywordScore": 80,
        "formatScore": 90,
        "sectionScore": 85,
        "details": {
          "matchedKeywords": ["react", "node"],
          "missingKeywords": ["aws", "docker"],
          "formatIssues": ["Missing bullet points in recent experience"],
          "missingSections": ["Certifications"]
        }
      }`;

      const userPrompt = `
      Job Description:
      ${jobText}

      Resume Content:
      ${resumeText}
      
      Provide the ATS evaluation JSON.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const parsedResponse = JSON.parse(response.choices[0].message.content);
      
      return {
        overallScore: parsedResponse.overallScore || 50,
        keywordScore: parsedResponse.keywordScore || 50,
        formatScore: parsedResponse.formatScore || 50,
        sectionScore: parsedResponse.sectionScore || 50,
        details: parsedResponse.details || {
          matchedKeywords: [],
          missingKeywords: [],
          formatIssues: [],
          missingSections: []
        }
      };
    } catch (error) {
      logger.error(`ATS scoring error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract text from resume
   */
  extractResumeText(resume) {
    if (typeof resume.content === 'string') {
      return resume.content;
    } else if (resume.content && typeof resume.content === 'object') {
      return JSON.stringify(resume.content);
    } else if (resume.parsedContent) {
      return JSON.stringify(resume.parsedContent);
    }
    return '';
  }

  /**
   * Extract text from job
   */
  extractJobText(job) {
    const parts = [
      job.title,
      job.description,
      ...(job.requirements || []),
      ...(job.skills || []),
      job.company || ''
    ];
    return parts.join(' ').toLowerCase();
  }

  /**
   * Generate ATS optimization suggestions using AI
   */
  async generateOptimizationSuggestions(resume, job) {
    try {
      const resumeText = this.extractResumeText(resume);
      const jobText = this.extractJobText(job);
      
      const prompt = `
        Analyze this resume against the job description and provide specific ATS optimization suggestions.
        
        Job Description:
        ${jobText}
        
        Resume:
        ${resumeText}
        
        Provide suggestions in JSON format:
        {
          "keywordSuggestions": ["keyword1", "keyword2"],
          "formatImprovements": ["improvement1", "improvement2"],
          "sectionRecommendations": ["section1", "section2"],
          "priority": "high|medium|low"
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      logger.error(`AI optimization suggestions error: ${error.message}`);
      return null;
    }
  }
}

export default new ATSScoringService();
