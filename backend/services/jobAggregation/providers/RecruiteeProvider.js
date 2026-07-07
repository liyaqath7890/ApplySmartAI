import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Recruitee Careers Provider
 * URL: https://<companyId>.recruitee.com/api/offers
 */
export class RecruiteeProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'recruitee';
  }

  isConfigured() {
    return true;
  }

  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const url = `https://${companyId}.recruitee.com/api/offers`;
      const response = await this.requestWithRetry(url, { method: 'GET' });

      const list = response?.offers || [];
      this.log(`Fetched ${list.length} postings for ${company.name}`);

      return list.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      this.log(`Error fetching Recruitee jobs for ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || rawJob.requirements || '';
    
    let workType = 'on-site';
    const wt = (rawJob.workplace_type || '').toLowerCase();
    if (wt.includes('remote')) workType = 'remote';
    else if (wt.includes('hybrid')) workType = 'hybrid';

    const companyId = rawJob.companyId || 'company';
    const jobUrl = rawJob.careers_url || `https://${companyId}.recruitee.com/o/${rawJob.slug}`;

    return {
      platform: 'recruitee',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employment_type || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.created_at || rawJob.published_at),
      source: 'Recruitee',
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

export default RecruiteeProvider;
