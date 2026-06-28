import axios from 'axios';
import logger from '../../../utils/logger.js';

/**
 * Base class for all job providers
 * Implements common functionality for fetching, normalizing, and storing jobs
 */
export class BaseJobProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = this.constructor.name;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.timeout = config.timeout || 30000;
    
    // Initialize axios instance with default config
    this.httpClient = axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': 'AI-Job-Agent/1.0',
        ...config.headers
      }
    });
  }

  /**
   * Fetch jobs from the provider
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Array>} Array of raw job objects
   */
  async fetchJobs(searchParams = {}) {
    throw new Error('fetchJobs must be implemented by subclass');
  }

  /**
   * Normalize a raw job object to the standard format
   * @param {Object} rawJob - Raw job object from provider
   * @returns {Object} Normalized job object
   */
  normalizeJob(rawJob) {
    throw new Error('normalizeJob must be implemented by subclass');
  }

  /**
   * Validate a normalized job object
   * @param {Object} job - Normalized job object
   * @returns {boolean} Whether the job is valid
   */
  validateJob(job) {
    if (!job.title || !job.company || !job.jobUrl) {
      return false;
    }
    
    // Validate URL format
    try {
      new URL(job.jobUrl);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Generate a unique external job ID
   * @param {Object} rawJob - Raw job object
   * @returns {string} Unique external job ID
   */
  generateExternalJobId(rawJob) {
    const platform = this.getPlatformName().toLowerCase();
    const rawId = rawJob.id || rawJob.job_id || rawJob.guid || 
                  rawJob.jobId || rawJob.JobId || 
                  this.extractIdFromUrl(rawJob.url || rawJob.jobUrl);
    
    return `${platform}-${this.sanitizeId(rawId)}`;
  }

  /**
   * Extract ID from URL if not directly available
   * @param {string} url - Job URL
   * @returns {string} Extracted ID
   */
  extractIdFromUrl(url) {
    if (!url) return 'unknown';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts[pathParts.length - 1] || urlObj.hostname;
    } catch {
      return url.substring(0, 50);
    }
  }

  /**
   * Sanitize ID to remove special characters
   * @param {string} id - Raw ID
   * @returns {string} Sanitized ID
   */
  sanitizeId(id) {
    return String(id).replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 100);
  }

  /**
   * Get the platform name
   * @returns {string} Platform name
   */
  getPlatformName() {
    return this.name.replace('Provider', '');
  }

  /**
   * Make an HTTP request with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Axios request options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} Response data
   */
  async requestWithRetry(url, options = {}, attempt = 1) {
    try {
      const response = await this.httpClient.request({
        url,
        ...options
      });
      return response.data;
    } catch (error) {
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn(`${this.name}: Retry ${attempt}/${this.retryAttempts} for ${url}`);
        await this.sleep(delay);
        return this.requestWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Whether the error is retryable
   */
  isRetryableError(error) {
    if (!error.response) return true; // Network errors are retryable
    const status = error.response.status;
    return status === 429 || status === 500 || status === 502 || 
           status === 503 || status === 504;
  }

  /**
   * Sleep for a given duration
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse date string to Date object
   * @param {string|number|Date} dateStr - Date string or timestamp
   * @returns {Date|null} Parsed date or null
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      // Handle relative dates like "2 days ago"
      if (typeof dateStr === 'string') {
        const match = dateStr.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const now = new Date();
          
          switch (unit) {
            case 'second': now.setSeconds(now.getSeconds() - value); break;
            case 'minute': now.setMinutes(now.getMinutes() - value); break;
            case 'hour': now.setHours(now.getHours() - value); break;
            case 'day': now.setDate(now.getDate() - value); break;
            case 'week': now.setDate(now.getDate() - value * 7); break;
            case 'month': now.setMonth(now.getMonth() - value); break;
            case 'year': now.setFullYear(now.getFullYear() - value); break;
          }
          return now;
        }
      }
      
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Parse salary string to min/max values
   * @param {string} salaryStr - Salary string
   * @returns {Object} Object with min, max, and currency
   */
  parseSalary(salaryStr) {
    if (!salaryStr) return { min: null, max: null, currency: 'USD' };
    
    const result = { min: null, max: null, currency: 'USD' };
    
    // Detect currency
    if (salaryStr.includes('₹') || salaryStr.includes('INR') || salaryStr.includes('Rs')) {
      result.currency = 'INR';
    } else if (salaryStr.includes('€')) {
      result.currency = 'EUR';
    } else if (salaryStr.includes('£')) {
      result.currency = 'GBP';
    }
    
    // Extract numbers
    const numbers = salaryStr.match(/[\d,]+\.?\d*/g);
    if (numbers && numbers.length >= 1) {
      result.min = parseFloat(numbers[0].replace(/,/g, ''));
      if (numbers.length >= 2) {
        result.max = parseFloat(numbers[1].replace(/,/g, ''));
      } else {
        result.max = result.min;
      }
    }
    
    return result;
  }

  /**
   * Normalize employment type
   * @param {string} type - Employment type string
   * @returns {string|null} Normalized employment type
   */
  normalizeEmploymentType(type) {
    if (!type) return null;
    
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('full')) return 'full-time';
    if (typeLower.includes('part')) return 'part-time';
    if (typeLower.includes('contract') || typeLower.includes('contractor')) return 'contract';
    if (typeLower.includes('intern')) return 'internship';
    if (typeLower.includes('freelance') || typeLower.includes('gig')) return 'freelance';
    
    return 'full-time'; // Default
  }

  /**
   * Normalize experience level
   * @param {string} level - Experience level string
   * @returns {string|null} Normalized experience level
   */
  normalizeExperienceLevel(level) {
    if (!level) return null;
    
    const levelLower = level.toLowerCase();
    
    if (levelLower.includes('entry') || levelLower.includes('junior') || levelLower.includes('fresh')) {
      return 'entry';
    }
    if (levelLower.includes('mid') || levelLower.includes('intermediate') || levelLower.includes('mid-level')) {
      return 'mid';
    }
    if (levelLower.includes('senior') || levelLower.includes('sr.') || levelLower.includes('sr ')) {
      return 'senior';
    }
    if (levelLower.includes('lead') || levelLower.includes('principal') || levelLower.includes('staff')) {
      return 'lead';
    }
    if (levelLower.includes('executive') || levelLower.includes('director') || 
        levelLower.includes('vp') || levelLower.includes('head') || levelLower.includes('chief')) {
      return 'executive';
    }
    
    return null;
  }

  /**
   * Normalize work type
   * @param {string} workType - Work type string
   * @returns {string|null} Normalized work type
   */
  normalizeWorkType(workType) {
    if (!workType) return null;
    
    const typeLower = workType.toLowerCase();
    
    if (typeLower.includes('remote') || typeLower.includes('work from home') || 
        typeLower.includes('wfh') || typeLower.includes('distributed')) {
      return 'remote';
    }
    if (typeLower.includes('hybrid') || typeLower.includes('mixed')) {
      return 'hybrid';
    }
    if (typeLower.includes('on-site') || typeLower.includes('onsite') || 
        typeLower.includes('office') || typeLower.includes('in-office')) {
      return 'on-site';
    }
    
    return null;
  }

  /**
   * Extract skills from job description
   * @param {string} description - Job description
   * @param {Array} knownSkills - Known skills to look for
   * @returns {Array} Array of extracted skills
   */
  extractSkills(description, knownSkills = []) {
    if (!description) return [];
    
    const descLower = description.toLowerCase();
    const skills = new Set();
    
    const commonTechSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'cpp', 'c++',
      'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'next.js',
      'django', 'flask', 'spring', 'django', 'fastapi',
      'aws', 'azure', 'gcp', 'google cloud', 'cloud computing',
      'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'database',
      'graphql', 'rest api', 'api design',
      'git', 'github', 'gitlab', 'bitbucket',
      'agile', 'scrum', 'kanban',
      'machine learning', 'ml', 'artificial intelligence', 'ai',
      'data science', 'data analysis', 'data engineering',
      'html', 'css', 'sass', 'tailwind', 'bootstrap',
      'flutter', 'react native', 'ios', 'android', 'mobile development',
      'devops', 'sre', 'site reliability',
      'microservices', 'serverless', 'lambda', 'cloud functions'
    ];
    
    const skillsToCheck = [...knownSkills.map(s => s.toLowerCase()), ...commonTechSkills];
    
    for (const skill of skillsToCheck) {
      if (descLower.includes(skill.toLowerCase())) {
        skills.add(this.capitalizeFirstLetter(skill));
      }
    }
    
    return Array.from(skills);
  }

  /**
   * Capitalize first letter of a string
   * @param {string} str - Input string
   * @returns {string} Capitalized string
   */
  capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Log provider activity
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    logger[level](`${this.name}: ${message}`);
  }
}

export default BaseJobProvider;