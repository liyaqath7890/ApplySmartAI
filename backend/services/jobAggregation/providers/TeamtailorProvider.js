import { BaseATSProvider } from './BaseATSProvider.js';
import Parser from 'rss-parser';
import logger from '../../../utils/logger.js';

/**
 * Teamtailor Career Page Adapter
 * Supports both unauthenticated public RSS/XML feeds and JSON:API access.
 * Documentation: https://docs.teamtailor.com
 */
export class TeamtailorProvider extends BaseATSProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.rssParser = new Parser();
    this.baseUrl = adapterConfig.baseUrl || 'https://api.teamtailor.com/v1';
    this.apiKey = adapterConfig.apiKey || process.env.TEAMTAILOR_API_KEY;
  }

  getPlatformName() {
    return 'teamtailor';
  }

  isConfigured() {
    return true; // Feeds require no key, JSON API uses env key
  }

  /**
   * Fetch jobs for a Company model instance (DB-driven, implements BaseATSProvider interface)
   */
  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    const apiKey = options.apiKey || this.apiKey;

    if (apiKey) {
      this.log(`Using JSON:API for ${company.name}`);
      return this._fetchViaJsonApi(companyId, apiKey, options);
    } else {
      this.log(`No API key, falling back to public RSS feed for ${company.name}`);
      return this._fetchViaRssFeed(company, companyId, options);
    }
  }

  /**
   * Fetch jobs using Teamtailor's authenticated JSON:API
   */
  async _fetchViaJsonApi(companyId, apiKey, options = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const url = `${this.baseUrl}/jobs`;
      
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token token=${apiKey}`,
          'X-Api-Version': '20210602',
          'Accept': 'application/vnd.api+json'
        },
        params: {
          'page[number]': page,
          'page[size]': limit,
          'filter[status]': 'published'
        }
      });

      if (response && response.data) {
        return response.data.map(item => ({
          ...item,
          companyId,
          sourceType: 'api'
        }));
      }

      return [];
    } catch (error) {
      this.log(`Error fetching via Teamtailor API for company ${companyId}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Fetch jobs using Teamtailor's unauthenticated public RSS feed
   */
  async _fetchViaRssFeed(company, companyId, options = {}) {
    try {
      // Teamtailor RSS feed URL is typically https://[company].teamtailor.com/jobs.rss
      // Allow overriding URL via careerPageUrl
      let url = `https://${companyId}.teamtailor.com/jobs.rss`;
      if (company.careerPageUrl) {
        try {
          const mainUrl = new URL(company.careerPageUrl);
          url = `${mainUrl.origin}/jobs.rss`;
        } catch {
          // Keep default if careerPageUrl is invalid URL
        }
      }

      const feed = await this.rssParser.parseURL(url);
      if (feed && feed.items) {
        return feed.items.map(item => ({
          ...item,
          companyId,
          companyDisplayName: feed.title || company.name,
          sourceType: 'rss'
        }));
      }

      return [];
    } catch (error) {
      this.log(`Error fetching via Teamtailor RSS for company ${companyId}: ${error.message}`, 'error');
      // Return empty instead of throwing to prevent crashing entire sync
      return [];
    }
  }

  /**
   * Test connectivity to Teamtailor for a given company
   */
  async testConnection(company) {
    try {
      const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
      const apiKey = this.apiKey;
      
      if (apiKey) {
        const url = `${this.baseUrl}/jobs`;
        await this.requestWithRetry(url, {
          method: 'GET',
          headers: {
            'Authorization': `Token token=${apiKey}`,
            'X-Api-Version': '20210602',
            'Accept': 'application/vnd.api+json'
          },
          params: { 'page[size]': 1 }
        });
        return { ok: true, message: 'JSON API Connected successfully' };
      } else {
        let url = `https://${companyId}.teamtailor.com/jobs.rss`;
        if (company.careerPageUrl) {
          try {
            const mainUrl = new URL(company.careerPageUrl);
            url = `${mainUrl.origin}/jobs.rss`;
          } catch {}
        }
        await this.rssParser.parseURL(url);
        return { ok: true, message: 'RSS Feed connected successfully' };
      }
    } catch (err) {
      return { ok: false, message: `Connection failed: ${err.message}` };
    }
  }

  /**
   * Normalize Teamtailor job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    if (rawJob.sourceType === 'api') {
      return this._normalizeJsonJob(rawJob);
    } else {
      return this._normalizeRssJob(rawJob);
    }
  }

  /**
   * Normalize JSON API job
   */
  _normalizeJsonJob(rawJob) {
    const attrs = rawJob.attributes || {};
    const description = attrs.body || attrs.pitch || '';
    const cleanDesc = this.cleanDescription(description);

    return {
      platform: 'teamtailor',
      externalJobId: this.generateExternalJobId(rawJob),
      title: attrs.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location: attrs.city || attrs.location || '',
      description: cleanDesc,
      requirements: this.extractRequirements(cleanDesc),
      responsibilities: this.extractResponsibilities(cleanDesc),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(attrs['employment-type'] || attrs.employmentType),
      experienceLevel: this.normalizeExperienceLevel(attrs.title),
      workType: attrs.remote ? 'remote' : 'on-site',
      jobUrl: attrs.slug ? `https://career.teamtailor.com/jobs/${rawJob.id}-${attrs.slug}` : `https://career.teamtailor.com/jobs/${rawJob.id}`,
      postedDate: this.parseDate(attrs['created-at'] || attrs.createdAt),
      source: 'Teamtailor API',
      raw: rawJob
    };
  }

  /**
   * Normalize RSS job
   */
  _normalizeRssJob(rawJob) {
    const description = rawJob.content || rawJob.description || '';
    const cleanDesc = this.cleanDescription(description);

    return {
      platform: 'teamtailor',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.location || '',
      description: cleanDesc,
      requirements: this.extractRequirements(cleanDesc),
      responsibilities: this.extractResponsibilities(cleanDesc),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType: this.inferWorkType(rawJob, cleanDesc),
      jobUrl: rawJob.link || rawJob.url,
      postedDate: this.parseDate(rawJob.pubDate || rawJob.isoDate),
      source: 'Teamtailor RSS Feed',
      raw: rawJob
    };
  }

  /**
   * Clean HTML tags
   */
  cleanDescription(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  extractRequirements(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 
                      'experience', 'skill', 'knowledge', 'proficient', 'years of'];
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        requirements.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return requirements.slice(0, 10);
  }

  extractResponsibilities(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const responsibilities = [];
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks', 
                      'will be', 'expected to', 'accountable'];
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return responsibilities.slice(0, 10);
  }

  inferWorkType(rawJob, description) {
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh')) {
      return 'remote';
    }
    if (descLower.includes('hybrid')) return 'hybrid';
    return 'on-site';
  }
}

export default TeamtailorProvider;
