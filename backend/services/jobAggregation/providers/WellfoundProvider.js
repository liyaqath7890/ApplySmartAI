import { BaseJobProvider } from './BaseProvider.js';
import config from '../../../config/index.js';
import logger from '../../../utils/logger.js';

/**
 * Wellfound (AngelList) Job Provider
 * Note: Wellfound doesn't have a public API, so this uses web scraping approach
 * For production use, consider using their partner API or official integration
 */
export class WellfoundProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.baseUrl = adapterConfig.baseUrl || 'https://wellfound.com';
    this.apiBaseUrl = adapterConfig.apiBaseUrl || 'https://wellfound.com/api';
    this.token = adapterConfig.token || process.env.WELLFOUND_API_TOKEN;
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    // Wellfound can be used without API token for basic scraping
    return true;
  }

  /**
   * Fetch jobs from Wellfound
   * Note: This is a simulated implementation as Wellfound doesn't have a public API
   */
  async fetchJobs(searchParams = {}) {
    try {
      const {
        keyword = '',
        location = '',
        page = 1,
        resultsPerPage = 50
      } = searchParams;

      // Wellfound API endpoint for job search
      const endpoint = '/api/search';
      const url = `${this.apiBaseUrl}${endpoint}`;

      const params = {
        query: keyword,
        location,
        page,
        per_page: resultsPerPage,
        sort: 'relevance'
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0) delete params[key];
      });

      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const data = await this.requestWithRetry(url, {
        method: 'GET',
        params,
        headers
      });

      if (data && data.jobs) {
        this.log(`Fetched ${data.jobs.length} jobs from Wellfound`);
        return data.jobs;
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from Wellfound: ${error.message}`, 'error');
      // Return empty array instead of throwing to not break aggregation
      return [];
    }
  }

  /**
   * Normalize a raw Wellfound job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const salaryData = rawJob.salary_range ? this.parseSalary(rawJob.salary_range) : { min: null, max: null, currency: 'USD' };

    const description = rawJob.description || rawJob.snippet || '';

    return {
      platform: 'wellfound',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title || rawJob.role,
      company: rawJob.company?.name || rawJob.company_name || 'Confidential',
      location: rawJob.location || rawJob.city || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary_range || (salaryData.min ? `$${salaryData.min} - $${salaryData.max}` : null),
      salaryMin: salaryData.min,
      salaryMax: salaryData.max,
      employmentType: this.normalizeEmploymentType(rawJob.job_type || rawJob.employment_type),
      experienceLevel: this.normalizeExperienceLevel(rawJob.seniority || rawJob.experience_level || rawJob.title),
      workType: this.inferWorkType(rawJob, description),
      jobUrl: rawJob.url || rawJob.job_url || `${this.baseUrl}/job/${rawJob.id}`,
      postedDate: this.parseDate(rawJob.published_at || rawJob.created_at),
      source: 'Wellfound',
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
                      'experience', 'skill', 'knowledge of', 'proficient', 'familiar with'];
    
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
                      'will be', 'expected to', 'accountable', 'own', 'drive'];
    
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
    // Check explicit remote indicators
    if (rawJob.remote || rawJob.is_remote) {
      return 'remote';
    }
    
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh') || descLower.includes('distributed team')) {
      return 'remote';
    }
    
    if (descLower.includes('hybrid')) {
      return 'hybrid';
    }
    
    return null;
  }
}

export default WellfoundProvider;