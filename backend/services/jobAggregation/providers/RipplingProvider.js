import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Rippling Careers Provider
 */
export class RipplingProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'rippling';
  }

  isConfigured() {
    return true;
  }

  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const url = `https://api.rippling.com/v1/jobs`;
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${company.socialLinks?.ripplingToken || 'dummy'}`
        }
      });

      const list = response?.data || response || [];
      this.log(`Fetched ${list.length} postings for ${company.name}`);

      return list.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      this.log(`Error fetching Rippling jobs for ${companyId}: ${error.message}. Returning fallback.`, 'warn');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || '';
    
    return {
      platform: 'rippling',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title || 'Job Opening',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: 'full-time',
      experienceLevel: this.normalizeExperienceLevel(rawJob.title || ''),
      workType: 'on-site',
      jobUrl: rawJob.url || 'https://rippling.com',
      postedDate: new Date(),
      source: 'Rippling',
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

export default RipplingProvider;
