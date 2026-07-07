import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Taleo Careers Provider
 * Fetches postings from Taleo REST endpoints.
 * URL: https://<company>.taleo.net/careersection/rest/jobboard/searchjobs
 */
export class TaleoProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'taleo';
  }

  isConfigured() {
    return true;
  }

  /**
   * Fetch company jobs using Taleo REST API.
   */
  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '');
    const section = company.socialLinks?.taleoSection || 'careersection';

    try {
      const url = `https://${companyId}.taleo.net/careersection/rest/jobboard/searchjobs`;
      
      const payload = {
        multilineKeywords: options.keyword || '',
        field1: 1,
        field2: -1,
        field3: -1
      };

      const response = await this.requestWithRetry(url, {
        method: 'POST',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const jobsList = response?.searchResults || response?.jobs || [];
      this.log(`Fetched ${jobsList.length} postings for ${company.name}`);

      return jobsList.map(job => ({
        ...job,
        companyDisplayName: company.name,
        companyId,
        section
      }));
    } catch (error) {
      this.log(`Error fetching Taleo jobs for ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize Taleo job object
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
    const section = rawJob.section || 'careersection';
    const jobUrl = rawJob.url || rawJob.jobUrl || `https://${companyId}.taleo.net/${section}/jobdetail.ftl?job=${rawJob.contestNo || rawJob.id}`;

    return {
      platform: 'taleo',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title || rawJob.jobTitle || 'Job Posting',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || rawJob.city || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary || null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title || ''),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.postDate || rawJob.postedDate),
      source: 'Taleo',
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

export default TaleoProvider;
