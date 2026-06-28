import { BaseJobProvider } from './BaseProvider.js';
import config from '../../../config/index.js';
import logger from '../../../utils/logger.js';

/**
 * Adzuna Job API Provider
 * Documentation: https://developer.adzuna.com/overview
 */
export class AdzunaProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.appId = adapterConfig.appId || process.env.ADZUNA_APP_ID;
    this.appKey = adapterConfig.appKey || process.env.ADZUNA_API_KEY;
    this.baseUrl = adapterConfig.baseUrl || 'https://api.adzuna.com/v1/api';
    this.country = adapterConfig.country || 'us'; // us, gb, in, au, ca, de, nl, fr, br, sg, za
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return this.appId && this.appKey;
  }

  /**
   * Fetch jobs from Adzuna API
   */
  async fetchJobs(searchParams = {}) {
    if (!this.isConfigured()) {
      this.log('Adzuna API credentials not configured, skipping', 'warn');
      return [];
    }

    try {
      const {
        keyword = '',
        location = '',
        category = '',
        page = 1,
        resultsPerPage = 50
      } = searchParams;

      const endpoint = `jobs/${this.country}/search/${page}`;
      const url = `${this.baseUrl}/${endpoint}`;

      const params = {
        app_id: this.appId,
        app_key: this.appKey,
        what: keyword,
        where: location,
        category: category || 'it-jobs',
        'content-type': 'application/json',
        results_per_page: resultsPerPage,
        'what-and': keyword,
        include_names: 1,
        sort_direction: 'date',
        created: 'days_7' // Jobs from last 7 days
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0) delete params[key];
      });

      const data = await this.requestWithRetry(url, {
        method: 'GET',
        params
      });

      if (data && data.results) {
        this.log(`Fetched ${data.results.length} jobs from Adzuna`);
        return data.results;
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from Adzuna: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw Adzuna job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const salaryData = rawJob.salary_min || rawJob.salary_max ? {
      min: rawJob.salary_min,
      max: rawJob.salary_max,
      currency: rawJob.salary_is_predicted ? 'predicted' : 'actual'
    } : this.parseSalary(rawJob.salary_preview);

    const description = rawJob.description || rawJob.contract_description || '';

    return {
      platform: 'adzuna',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.company?.display_name || rawJob.company?.name || 'Confidential',
      location: rawJob.location?.display_name || rawJob.location?.area?.join(', ') || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary_preview || (salaryData.min ? `$${salaryData.min} - $${salaryData.max}` : null),
      salaryMin: salaryData.min,
      salaryMax: salaryData.max,
      employmentType: this.normalizeEmploymentType(rawJob.contract_time),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType: this.inferWorkType(rawJob, description),
      jobUrl: rawJob.redirect_url || rawJob.url,
      postedDate: this.parseDate(rawJob.created),
      source: 'Adzuna',
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
                      'experience', 'skill', 'knowledge of', 'proficient'];
    
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

  /**
   * Infer work type from job data
   */
  inferWorkType(rawJob, description) {
    // Check explicit remote indicators
    if (rawJob.location?.area?.some(a => a.toLowerCase().includes('remote'))) {
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

export default AdzunaProvider;