import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * iCIMS Careers Page Adapter
 * Fetches and parses public postings from iCIMS portal search endpoints.
 * URL: https://api.icims.com/assets/v1/companies/<companyId>/jobs (or standard search scraping)
 */
export class iCIMSProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'icims';
  }

  isConfigured() {
    return true;
  }

  /**
   * Fetch company jobs using public search URL or JSON api.
   */
  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    const limit = options.limit || 50;
    const page = options.page || 1;

    try {
      // iCIMS public search portals support simple JSON API structures on backend or XML feeds
      const url = `https://${companyId}-careers.icims.com/jobs/search`;
      
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        params: {
          in_iframe: 1,
          pr: page - 1, // 0-indexed page
          searchKeyword: options.keyword || '',
          schema: 'json'
        }
      });

      // iCIMS returns listings inside standard JSON schemas or array objects depending on portal settings
      // We will parse the array items returned
      const jobsList = Array.isArray(response) ? response : (response?.jobs || response?.searchResults || []);
      
      this.log(`Fetched ${jobsList.length} postings for ${company.name} (page ${page})`);

      return jobsList.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      this.log(`Error fetching iCIMS jobs for ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize iCIMS job object
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || rawJob.jobDescription || '';
    
    let workType = 'on-site';
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || descLower.includes('wfh')) {
      workType = 'remote';
    } else if (descLower.includes('hybrid')) {
      workType = 'hybrid';
    }

    const companyId = rawJob.companyId || 'company';
    const jobUrl = rawJob.url || rawJob.jobUrl || `https://${companyId}-careers.icims.com/jobs/${rawJob.id || rawJob.jobId}`;

    return {
      platform: 'icims',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title || rawJob.name || 'Job Posting',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || rawJob.city || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary || null,
      salaryMin: rawJob.salaryMin || null,
      salaryMax: rawJob.salaryMax || null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title || ''),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.postedDate || rawJob.datePosted),
      source: 'iCIMS',
      raw: rawJob
    };
  }

  cleanDescription(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  extractRequirements(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 'experience', 'skill', 'knowledge'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(k => lower.includes(k)) && line.length > 10 && line.length < 500) {
        requirements.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return requirements.slice(0, 10);
  }

  extractResponsibilities(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const responsibilities = [];
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(k => lower.includes(k)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return responsibilities.slice(0, 10);
  }
}

export default iCIMSProvider;
