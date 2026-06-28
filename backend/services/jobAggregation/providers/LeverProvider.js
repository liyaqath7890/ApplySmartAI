import { BaseJobProvider } from './BaseProvider.js';

/**
 * Lever Career Page Adapter
 * Scrapes jobs from company career pages powered by Lever
 * Documentation: https://hire.lever.co/
 */
export class LeverProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.baseUrl = adapterConfig.baseUrl || 'https://api.lever.co/v0/postings';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return true; // Public API for postings
  }

  /**
   * Fetch jobs from Lever API
   */
  async fetchJobs(searchParams = {}) {
    try {
      const {
        companyIds = [],
        keyword = '',
        location = ''
      } = searchParams;

      // Default to some well-known tech companies using Lever
      const defaultCompanies = [
        ' Coursera', 'udemy', 'datacamp', 'figma', 'canva', 
        'notion', 'airtable', 'zapier', 'gitlab', 'hubspot'
      ];
      
      const companies = companyIds.length > 0 ? companyIds : defaultCompanies;
      const allJobs = [];

      for (const companyId of companies) {
        try {
          const url = `${this.baseUrl}/${companyId}`;
          
          const data = await this.requestWithRetry(url, {
            method: 'GET'
          });

          if (Array.isArray(data)) {
            const companyJobs = data.map(job => ({
              ...job,
              companyName: companyId
            }));
            allJobs.push(...companyJobs);
            this.log(`Fetched ${companyJobs.length} jobs from ${companyId}`);
          }
        } catch (error) {
          this.log(`Error fetching jobs from ${companyId}: ${error.message}`, 'warn');
        }
      }

      return allJobs;
    } catch (error) {
      this.log(`Error fetching jobs from Lever: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Fetch jobs from a specific company's Lever board
   */
  async fetchCompanyJobs(companyId, searchParams = {}) {
    try {
      const url = `${this.baseUrl}/${companyId}`;
      
      const data = await this.requestWithRetry(url, {
        method: 'GET'
      });

      if (Array.isArray(data)) {
        return data.map(job => ({
          ...job,
          companyName: companyId
        }));
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw Lever job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || rawJob.content || '';
    const textContent = this.extractTextContent(description);

    return {
      platform: 'lever',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyName || rawJob.company || 'Confidential',
      location: rawJob.location || '',
      description: textContent,
      requirements: this.extractRequirements(textContent),
      responsibilities: this.extractResponsibilities(textContent),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType || rawJob.employment_type),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType: this.inferWorkType(rawJob, textContent),
      jobUrl: rawJob.url || rawJob.hostingUrl || `https://hire.lever.co/${rawJob.companyName}/${rawJob.id}`,
      postedDate: this.parseDate(rawJob.createdAt || rawJob.created_at),
      source: 'Lever',
      raw: rawJob
    };
  }

  /**
   * Extract text content from HTML description
   */
  extractTextContent(html) {
    if (!html) return '';
    
    // If it's already plain text, return as is
    if (!html.includes('<')) return html;
    
    return html
      .replace(/<[^>]*>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract requirements from description
   */
  extractRequirements(description) {
    if (!description) return [];
    
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 
                      'experience', 'skill', 'knowledge', 'proficient', 'years of',
                      'expertise', 'familiarity'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        requirements.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    
    return requirements.slice(0, 10);
  }

  /**
   * Extract responsibilities from description
   */
  extractResponsibilities(description) {
    if (!description) return [];
    
    const lines = description.split('\n');
    const responsibilities = [];
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks', 
                      'will be', 'expected to', 'accountable', "you'll", 'about the role'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    
    return responsibilities.slice(0, 10);
  }

  /**
   * Infer work type from job data
   */
  inferWorkType(rawJob, description) {
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh') || descLower.includes('distributed')) {
      return 'remote';
    }
    if (descLower.includes('hybrid')) return 'hybrid';
    if (descLower.includes('on-site') || descLower.includes('office')) return 'on-site';
    return null;
  }
}

export default LeverProvider;