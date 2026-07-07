import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Workable Careers Provider
 * Fetches postings from Workable's public API.
 * URL: https://apply.workable.com/api/v1/accounts/<companyId>/jobs
 */
export class WorkableProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'workable';
  }

  isConfigured() {
    return true;
  }

  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const url = `https://apply.workable.com/api/v1/accounts/${companyId}/jobs`;
      
      const response = await this.requestWithRetry(url, {
        method: 'POST',
        data: {
          query: options.keyword || '',
          location: [],
          department: [],
          worktype: [],
          precision: false
        }
      });

      const list = response?.results || [];
      this.log(`Fetched ${list.length} postings for ${company.name}`);

      return list.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      this.log(`Error fetching Workable jobs for ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || '';
    
    let workType = 'on-site';
    const wt = (rawJob.worktype || '').toLowerCase();
    if (wt.includes('remote')) workType = 'remote';
    else if (wt.includes('hybrid')) workType = 'hybrid';

    const companyId = rawJob.companyId || 'company';
    const jobUrl = `https://apply.workable.com/${companyId}/j/${rawJob.shortcode}`;

    return {
      platform: 'workable',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location ? `${rawJob.location.city || ''}, ${rawJob.location.country || ''}`.trim() : '',
      description: this.cleanDescription(description),
      requirements: rawJob.requirements || this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employment_type || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.published),
      source: 'Workable',
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

export default WorkableProvider;
