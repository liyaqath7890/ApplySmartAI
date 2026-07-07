import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * SAP SuccessFactors Provider
 * Fetches public postings from SAP SuccessFactors OData v2 JobRequisition endpoint.
 * URL format: https://api<datacenter>.successfactors.com/odata/v2/JobRequisition
 */
export class SAPSuccessFactorsProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
    this.defaultDatacenter = config.defaultDatacenter || '5'; // e.g. career5
  }

  getPlatformName() {
    return 'sap';
  }

  isConfigured() {
    return true;
  }

  /**
   * Fetch company jobs using SuccessFactors OData API.
   */
  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '');
    const datacenter = company.socialLinks?.successFactorsDatacenter || this.defaultDatacenter;
    const limit = options.limit || 50;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    try {
      const url = `https://career${datacenter}.successfactors.eu/odata/v2/JobRequisition`;
      
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        params: {
          $format: 'json',
          $top: limit,
          $skip: offset,
          $filter: `company eq '${companyId}'`
        }
      });

      const items = response?.d?.results || response?.results || [];
      this.log(`Fetched ${items.length} postings for ${company.name} (page ${page})`);

      return items.map(item => ({
        ...item,
        companyDisplayName: company.name,
        companyId,
        datacenter
      }));
    } catch (error) {
      this.log(`Error fetching SAP SuccessFactors jobs for ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize SAP SuccessFactors job object
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.jobDescription || rawJob.introParagraph || '';
    
    let workType = 'on-site';
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || descLower.includes('wfh')) {
      workType = 'remote';
    } else if (descLower.includes('hybrid')) {
      workType = 'hybrid';
    }

    const companyId = rawJob.companyId || 'company';
    const datacenter = rawJob.datacenter || '5';
    const jobUrl = `https://career${datacenter}.successfactors.eu/sfcareer/jobreqcareer?company=${companyId}&jobId=${rawJob.jobReqId || rawJob.id}`;

    return {
      platform: 'sap',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.jobTitle || rawJob.title || 'Job Posting',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || rawJob.facility || '',
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
      postedDate: this.parseDate(rawJob.postingStartDate || rawJob.lastModifiedDateTime),
      source: 'SAP SuccessFactors',
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

export default SAPSuccessFactorsProvider;
