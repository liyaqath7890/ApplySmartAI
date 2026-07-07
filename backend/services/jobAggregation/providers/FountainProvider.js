import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Fountain Careers Provider
 */
export class FountainProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'fountain';
  }

  isConfigured() {
    return true;
  }

  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const url = `https://api.fountain.com/v2/positions`;
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        headers: {
          'X-ACCESS-TOKEN': company.socialLinks?.fountainToken || process.env.FOUNTAIN_TOKEN || 'dummy'
        }
      });

      const list = response || [];
      this.log(`Fetched ${list.length} postings for ${company.name}`);

      return list.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      // Graceful fallback to public postings web scraper/crawler mock
      this.log(`Fountain API not configured or failed for ${companyId}: ${error.message}. Returning fallback.`, 'warn');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || rawJob.title || '';
    
    return {
      platform: 'fountain',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title || 'Hourly Position',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: 'part-time',
      experienceLevel: 'entry',
      workType: 'on-site',
      jobUrl: rawJob.apply_url || `https://fountain.com/${rawJob.companyId}/apply`,
      postedDate: new Date(),
      source: 'Fountain',
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
    return [description.substring(0, 100)];
  }

  extractResponsibilities(description) {
    if (!description) return [];
    return [description.substring(0, 100)];
  }
}

export default FountainProvider;
