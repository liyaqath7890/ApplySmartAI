import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Zoho Recruit Careers Provider
 */
export class ZohoRecruitProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'zohorecruit';
  }

  isConfigured() {
    return true;
  }

  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const url = `https://recruit.zoho.com/recruit/v2/public/Job_Openings`;
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${company.socialLinks?.zohoToken || 'dummy'}`
        }
      });

      const list = response?.data || [];
      this.log(`Fetched ${list.length} postings for ${company.name}`);

      return list.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      this.log(`Error fetching Zoho Recruit jobs for ${companyId}: ${error.message}. Returning fallback.`, 'warn');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.Job_Description || rawJob.Description || '';
    
    return {
      platform: 'zohorecruit',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.Posting_Title || rawJob.Title || 'Job Opening',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.City || rawJob.Location || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.Salary || null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.Job_Type || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.Posting_Title || ''),
      workType: 'on-site',
      jobUrl: rawJob.Apply_URL || 'https://zoho.com',
      postedDate: this.parseDate(rawJob.Created_Time || rawJob.Modified_Time),
      source: 'Zoho Recruit',
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

export default ZohoRecruitProvider;
