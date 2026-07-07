import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Darwinbox Careers Provider
 * Fetches jobs from Darwinbox candidate career site JSON endpoints.
 * URL: https://<company>.darwinbox.in/ms/v2/candidate/career/getjobs
 */
export class DarwinboxProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'darwinbox';
  }

  isConfigured() {
    return true;
  }

  /**
   * Fetch company jobs using Darwinbox's candidate jobs endpoint.
   */
  async fetchCompanyJobs(company, options = {}) {
    const tenant = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '');
    const page = options.page || 1;
    const limit = options.limit || 20;

    try {
      const url = `https://${tenant}.darwinbox.in/ms/v2/candidate/career/getjobs`;
      
      const response = await this.requestWithRetry(url, {
        method: 'POST',
        data: {
          page,
          limit,
          search: options.keyword || ''
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const jobsList = response?.jobs || response?.data || [];
      this.log(`Fetched ${jobsList.length} postings for ${company.name} (page ${page})`);

      return jobsList.map(job => ({
        ...job,
        companyDisplayName: company.name,
        tenant
      }));
    } catch (error) {
      this.log(`Error fetching Darwinbox jobs for ${tenant}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize Darwinbox job object
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || rawJob.job_description || '';
    
    let workType = 'on-site';
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || descLower.includes('wfh')) {
      workType = 'remote';
    } else if (descLower.includes('hybrid')) {
      workType = 'hybrid';
    }

    const tenant = rawJob.tenant || 'company';
    const jobUrl = `https://${tenant}.darwinbox.in/ms/candidate/career/jobs/view/job/${rawJob.id || rawJob.job_id}`;

    return {
      platform: 'darwinbox',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title || rawJob.job_title || 'Job Opening',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || rawJob.city || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary || null,
      salaryMin: rawJob.salary_min || null,
      salaryMax: rawJob.salary_max || null,
      employmentType: this.normalizeEmploymentType(rawJob.employment_type || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title || ''),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.posted_date || rawJob.created_at),
      source: 'Darwinbox',
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

export default DarwinboxProvider;
