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
      
      // Keyword matching
      const keywordScore = this.calculateKeywordMatch(resumeText, jobText);
      
      // Format compliance
      const formatScore = this.calculateFormatCompliance(resume);
      
      // Section completeness
      const sectionScore = this.calculateSectionCompleteness(resume);
      
      // Overall ATS score (weighted average)
      const overallScore = Math.round(
        (keywordScore * 0.5) + 
        (formatScore * 0.2) + 
        (sectionScore * 0.3)
      );
      
      return {
        overallScore,
        keywordScore,
        formatScore,
        sectionScore,
        details: {
          matchedKeywords: this.getMatchedKeywords(resumeText, jobText),
          missingKeywords: this.getMissingKeywords(resumeText, jobText),
          formatIssues: this.getFormatIssues(resume),
          missingSections: this.getMissingSections(resume)
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
   * Calculate keyword match score
   */
  calculateKeywordMatch(resumeText, jobText) {
    const jobKeywords = this.extractKeywords(jobText);
    const resumeKeywords = this.extractKeywords(resumeText.toLowerCase());
    
    const matched = jobKeywords.filter(keyword => 
      resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk))
    );
    
    return jobKeywords.length > 0 
      ? Math.round((matched.length / jobKeywords.length) * 100)
      : 0;
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'with', 'this', 'that', 'from', 'they', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'into', 'year', 'your', 'just', 'over', 'also', 'such', 'because', 'these', 'first', 'being', 'through', 'most', 'must']);
    
    return [...new Set(words.filter(word => !stopWords.has(word)))];
  }

  /**
   * Calculate format compliance score
   */
  calculateFormatCompliance(resume) {
    let score = 100;
    const issues = [];
    
    if (!resume.content) {
      score -= 30;
      issues.push('Missing resume content');
    }
    
    if (resume.fileSize && resume.fileSize > 2000000) {
      score -= 20;
      issues.push('File size too large (>2MB)');
    }
    
    if (resume.fileType && !['pdf', 'docx', 'txt'].includes(resume.fileType.toLowerCase())) {
      score -= 20;
      issues.push('Unsupported file format');
    }
    
    return Math.max(0, score);
  }

  /**
   * Calculate section completeness score
   */
  calculateSectionCompleteness(resume) {
    let score = 0;
    const requiredSections = ['contact', 'experience', 'education', 'skills'];
    
    const resumeText = this.extractResumeText(resume).toLowerCase();
    
    if (resumeText.includes('@') || resumeText.includes('email') || resumeText.includes('phone')) {
      score += 25;
    }
    
    if (resumeText.includes('experience') || resumeText.includes('work')) {
      score += 25;
    }
    
    if (resumeText.includes('education') || resumeText.includes('degree') || resumeText.includes('university')) {
      score += 25;
    }
    
    if (resumeText.includes('skills') || resumeText.includes('technologies') || resumeText.includes('proficient')) {
      score += 25;
    }
    
    return score;
  }

  /**
   * Get matched keywords
   */
  getMatchedKeywords(resumeText, jobText) {
    const jobKeywords = this.extractKeywords(jobText);
    const resumeKeywords = this.extractKeywords(resumeText.toLowerCase());
    
    return jobKeywords.filter(keyword => 
      resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk))
    );
  }

  /**
   * Get missing keywords
   */
  getMissingKeywords(resumeText, jobText) {
    const jobKeywords = this.extractKeywords(jobText);
    const resumeKeywords = this.extractKeywords(resumeText.toLowerCase());
    
    return jobKeywords.filter(keyword => 
      !resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk))
    );
  }

  /**
   * Get format issues
   */
  getFormatIssues(resume) {
    const issues = [];
    
    if (!resume.content) {
      issues.push('Missing resume content');
    }
    
    if (resume.fileSize && resume.fileSize > 2000000) {
      issues.push('File size too large (>2MB)');
    }
    
    if (resume.fileType && !['pdf', 'docx', 'txt'].includes(resume.fileType.toLowerCase())) {
      issues.push('Unsupported file format');
    }
    
    return issues;
  }

  /**
   * Get missing sections
   */
  getMissingSections(resume) {
    const missing = [];
    const resumeText = this.extractResumeText(resume).toLowerCase();
    
    if (!resumeText.includes('@') && !resumeText.includes('email') && !resumeText.includes('phone')) {
      missing.push('Contact Information');
    }
    
    if (!resumeText.includes('experience') && !resumeText.includes('work')) {
      missing.push('Work Experience');
    }
    
    if (!resumeText.includes('education') && !resumeText.includes('degree') && !resumeText.includes('university')) {
      missing.push('Education');
    }
    
    if (!resumeText.includes('skills') && !resumeText.includes('technologies') && !resumeText.includes('proficient')) {
      missing.push('Skills');
    }
    
    return missing;
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
