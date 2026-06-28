import { BaseJobProvider } from './BaseProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Arbeitnow API Provider
 * Documentation: https://arbeitnow.com/en/job-api
 * Free API, no authentication required
 */
export class ArbeitnowProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.baseUrl = adapterConfig.baseUrl || 'https://arbeitnow.com/api';
  }

  /**
   * Provider is always configured (free API)
   */
  isConfigured() {
    return true;
  }

  /**
   * Fetch jobs from Arbeitnow API
   */
  async fetchJobs(searchParams = {}) {
    try {
      const {
        keyword = 'software developer',
        location = '',
        remote = false,
        visa = false,
        page = 1,
        perPage = 100
      } = searchParams;

      const url = `${this.baseUrl}/jobs-search`;
      
      const params = {
        title: keyword,
        location: location || 'Germany',
        remote: remote,
        visa: visa,
        page: page,
        per_page: perPage,
        sort: 'date' // Sort by date descending
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) delete params[key];
      });

      const data = await this.requestWithRetry(url, {
        method: 'GET',
        params
      });

      if (data && data.data) {
        this.log(`Fetched ${data.data.length} jobs from Arbeitnow`);
        return data.data;
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from Arbeitnow: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw Arbeitnow job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || '';
    const salaryData = this.parseSalary(rawJob.salary);

    return {
      platform: 'arbeitnow',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.company,
      location: rawJob.location,
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary || null,
      salaryMin: salaryData.min,
      salaryMax: salaryData.max,
      employmentType: this.normalizeEmploymentType(rawJob.employment_type),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType: rawJob.remote ? 'remote' : this.inferWorkType(rawJob, description),
      jobUrl: rawJob.url,
      postedDate: this.parseDate(rawJob.date),
      source: 'Arbeitnow',
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
   * Extract requirements from description
   */
  extractRequirements(description) {
    if (!description) return [];
    
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 
                      'experience', 'skill', 'knowledge', 'proficient', 'years'];
    
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
                      'will be', 'expected to', 'accountable', 'your task'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    
    return responsibilities.slice(0, 10);
  }

  /**
   * Infer work type from job data
   */
  inferWorkType(rawJob, description) {
    if (rawJob.remote) return 'remote';
    
    const descLower = description.toLowerCase();
    if (descLower.includes('hybrid')) return 'hybrid';
    if (descLower.includes('on-site') || descLower.includes('office')) return 'on-site';
    
    return null;
  }
}

export default ArbeitnowProvider;