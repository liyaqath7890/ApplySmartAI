import { BaseATSProvider } from './BaseATSProvider.js';
import Parser from 'rss-parser';
import logger from '../../../utils/logger.js';

/**
 * JazzHR Careers Provider
 * URL: https://<companyId>.applytojob.com/feed
 */
export class JazzHRProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
    this.parser = new Parser();
  }

  getPlatformName() {
    return 'jazzhr';
  }

  isConfigured() {
    return true;
  }

  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '');
    
    try {
      const url = `https://${companyId}.applytojob.com/feed`;
      const feed = await this.parser.parseURL(url);

      const list = feed?.items || [];
      this.log(`Fetched ${list.length} postings for ${company.name}`);

      return list.map(item => ({
        ...item,
        companyDisplayName: company.name,
        companyId
      }));
    } catch (error) {
      this.log(`Error fetching JazzHR jobs for ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.content || rawJob.contentSnippet || '';
    
    let workType = 'on-site';
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || descLower.includes('wfh')) {
      workType = 'remote';
    } else if (descLower.includes('hybrid')) {
      workType = 'hybrid';
    }

    return {
      platform: 'jazzhr',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.categories?.join(', ') || rawJob.location || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: 'full-time',
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType,
      jobUrl: rawJob.link || rawJob.guid,
      postedDate: this.parseDate(rawJob.pubDate || rawJob.isoDate),
      source: 'JazzHR',
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

export default JazzHRProvider;
