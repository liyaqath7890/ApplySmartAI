import { BaseJobProvider } from './BaseProvider.js';
import logger from '../../../utils/logger.js';

/**
 * RemoteOK API Provider
 * Documentation: https://remoteok.com/api
 * Free API for basic access
 */
export class RemoteOKProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.apiKey = adapterConfig.apiKey || process.env.REMOTEOK_API_KEY;
    this.baseUrl = adapterConfig.baseUrl || 'https://remoteok.com/api';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return true; // Free API, but can use key for higher limits
  }

  /**
   * Fetch jobs from RemoteOK API
   */
  async fetchJobs(searchParams = {}) {
    try {
      const {
        keyword = 'software',
        location = '',
        tags = '',
        page = 1
      } = searchParams;

      const url = `${this.baseUrl}`;
      
      const params = {
        search: keyword,
        location: location || 'worldwide',
        tags: tags || 'software,devops,dev',
        page: page
      };

      // Add API key if available for higher rate limits
      if (this.apiKey) {
        params.key = this.apiKey;
      }

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) delete params[key];
      });

      const data = await this.requestWithRetry(url, {
        method: 'GET',
        params
      });

      if (Array.isArray(data)) {
        this.log(`Fetched ${data.length} jobs from RemoteOK`);
        return data;
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from RemoteOK: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw RemoteOK job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || '';
    const salaryData = rawJob.salary || rawJob.salarymax ? {
      min: rawJob.salarymin || rawJob.salary,
      max: rawJob.salarymax || rawJob.salary,
      currency: 'USD'
    } : { min: null, max: null, currency: 'USD' };

    return {
      platform: 'remoteok',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.position,
      company: rawJob.company,
      location: rawJob.location || 'Remote',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(rawJob, description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary ? `$${rawJob.salary} - $${rawJob.salarymax || rawJob.salary}k` : null,
      salaryMin: salaryData.min ? salaryData.min * 1000 : null,
      salaryMax: salaryData.max ? salaryData.max * 1000 : null,
      employmentType: 'full-time', // RemoteOK primarily lists full-time positions
      experienceLevel: this.normalizeExperienceLevel(rawJob.position),
      workType: 'remote', // RemoteOK is specifically for remote jobs
      jobUrl: `https://remoteok.com${rawJob.url}`,
      postedDate: this.parseDate(rawJob.date * 1000), // Unix timestamp
      source: 'RemoteOK',
      raw: rawJob
    };
  }

  /**
   * Clean HTML tags from description
   */
  cleanDescription(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract requirements from job data and description
   */
  extractRequirements(rawJob, description) {
    const requirements = [];
    
    // Extract from tags
    if (rawJob.tags) {
      const tagList = rawJob.tags.split(',');
      requirements.push(...tagList.slice(0, 5).map(tag => `Skill: ${tag.trim()}`));
    }
    
    // Extract from description
    const lines = description.split('\n');
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 
                      'experience', 'skill', 'knowledge', 'proficient'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        requirements.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    
    return requirements.slice(0, 10);
  }

  /**
   * Extract responsibilities from description
   */
  extractResponsibilities(description) {
    if (!description) return [];
    
    const lines = description.split('\n');
    const responsibilities = [];
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks', 
                      'will be', 'expected to', 'accountable'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    
    return responsibilities.slice(0, 10);
  }
}

export default RemoteOKProvider;