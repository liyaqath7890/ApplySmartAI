import { BaseJobProvider } from './BaseProvider.js';

/**
 * Greenhouse Career Page Adapter
 * Scrapes jobs from company career pages powered by Greenhouse
 * Documentation: https://developers.greenhouse.io/harvest.html
 */
export class GreenhouseProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.apiKey = adapterConfig.apiKey || process.env.GREENHOUSE_API_KEY;
    this.baseUrl = adapterConfig.baseUrl || 'https://boards-api.greenhouse.io/v1';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return true; // Public API for boards, Harvest API requires key
  }

  /**
   * Fetch jobs from Greenhouse board API
   */
  async fetchJobs(searchParams = {}) {
    try {
      const {
        companyIds = [],
        keyword = '',
        location = ''
      } = searchParams;

      // Default to some well-known tech companies using Greenhouse
      const defaultCompanies = [
        'airbnb', 'lyft', 'shopify', 'stripe', 'square', 
        'doordash', 'instacart', 'coinbase', 'robinhood'
      ];
      
      const companies = companyIds.length > 0 ? companyIds : defaultCompanies;
      const allJobs = [];

      for (const companyId of companies) {
        try {
          const url = `${this.baseUrl}/boards/${companyId}/jobs`;
          const params = { content: true };
          
          const data = await this.requestWithRetry(url, {
            method: 'GET',
            params
          });

          if (data && data.jobs) {
            const companyJobs = data.jobs.map(job => ({
              ...job,
              companyName: companyId,
              companyDisplayName: data.name || companyId
            }));
            allJobs.push(...companyJobs);
            this.log(`Fetched ${companyJobs.length} jobs from ${companyId}`);
          }
        } catch (error) {
          this.log(`Error fetching jobs from ${companyId}: ${error.message}`, 'warn');
        }
      }

      return allJobs;
    } catch (error) {
      this.log(`Error fetching jobs from Greenhouse: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Fetch jobs from a specific company's Greenhouse board
   */
  async fetchCompanyJobs(companyId, searchParams = {}) {
    try {
      const url = `${this.baseUrl}/boards/${companyId}/jobs`;
      const params = { content: true };
      
      const data = await this.requestWithRetry(url, {
        method: 'GET',
        params
      });

      if (data && data.jobs) {
        return data.jobs.map(job => ({
          ...job,
          companyName: companyId,
          companyDisplayName: data.name || companyId
        }));
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw Greenhouse job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.contents || rawJob.description || '';
    const salaryData = this.parseSalary(rawJob.location?.name);

    return {
      platform: 'greenhouse',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || rawJob.companyName || 'Confidential',
      location: rawJob.location?.name || rawJob.location_name || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null, // Greenhouse doesn't always expose salary in public API
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employment_type),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType: this.inferWorkType(rawJob, description),
      jobUrl: rawJob.absolute_url || `https://boards.greenhouse.io/${rawJob.companyName}/jobs/${rawJob.id}`,
      postedDate: this.parseDate(rawJob.updated_at || rawJob.created_at),
      source: 'Greenhouse',
      raw: rawJob
    };
  }

  /**
   * Clean HTML tags from description
   */
  cleanDescription(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Extract requirements from description
   */
  extractRequirements(description) {
    if (!description) return [];
    
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 
                      'experience', 'skill', 'knowledge', 'proficient', 'years of'];
    
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
                      'will be', 'expected to', 'accountable', "you'll"];
    
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
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh') || descLower.includes('distributed')) {
      return 'remote';
    }
    if (descLower.includes('hybrid')) return 'hybrid';
    if (descLower.includes('on-site') || descLower.includes('office')) return 'on-site';
    return null;
  }
}

export default GreenhouseProvider;