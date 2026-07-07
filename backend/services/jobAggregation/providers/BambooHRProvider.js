import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * BambooHR Careers Provider
 * URL: https://<companyId>.bamboohr.com/jobs/embed.php?m=json
 */
export class BambooHRProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'bamboohr';
  }

  isConfigured() {
    return true;
  }

  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '');
    
    try {
      const url = `https://${companyId}.bamboohr.com/jobs/embed.php`;
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        params: { m: 'json' }
      });

      const list = Array.isArray(response) ? response : [];
      this.log(`Fetched ${list.length} postings for ${company.name}`);

      return list.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      this.log(`Error fetching BambooHR jobs for ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || '';
    
    let workType = 'on-site';
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || descLower.includes('wfh')) {
      workType = 'remote';
    } else if (descLower.includes('hybrid')) {
      workType = 'hybrid';
    }

    const companyId = rawJob.companyId || 'company';
    const jobUrl = `https://${companyId}.bamboohr.com/careers/${rawJob.id}`;

    return {
      platform: 'bamboohr',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.jobTitle || rawJob.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location?.name || rawJob.location || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.jobTitle || ''),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.postedDate || rawJob.datePosted),
      source: 'BambooHR',
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

export default BambooHRProvider;
