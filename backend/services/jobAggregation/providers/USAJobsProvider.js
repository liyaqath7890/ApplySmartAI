import { BaseJobProvider } from './BaseProvider.js';

/**
 * USAJobs API Provider
 * Documentation: https://developer.usajobs.gov/
 * Free API for US government jobs
 */
export class USAJobsProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.apiKey = adapterConfig.apiKey || process.env.USAJOBS_API_KEY;
    this.baseUrl = adapterConfig.baseUrl || 'https://data.usajobs.gov/api';
    this.userAgent = adapterConfig.userAgent || 'AI-Job-Agent/1.0';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return this.apiKey;
  }

  /**
   * Fetch jobs from USAJobs API
   */
  async fetchJobs(searchParams = {}) {
    if (!this.isConfigured()) {
      this.log('USAJobs API credentials not configured, skipping', 'warn');
      return [];
    }

    try {
      const {
        keyword = 'software',
        location = '',
        jobCategory = 'Information Technology',
        whoMayApply = 'All',
        page = 1,
        resultsPerPage = 50
      } = searchParams;

      const url = `${this.baseUrl}/Search`;
      
      const params = {
        Keyword: keyword,
        LocationName: location,
        JobCategoryCode: jobCategory,
        WhoMayApply: whoMayApply,
        Page: page,
        ResultsPerPage: resultsPerPage,
        Sort: 'Relevance'
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const data = await this.requestWithRetry(url, {
        method: 'GET',
        params,
        headers: {
          'Authorization-Key': this.apiKey,
          'User-Agent': this.userAgent
        }
      });

      if (data && data.SearchResult && data.SearchResult.SearchResultItems) {
        const jobs = data.SearchResult.SearchResultItems.map(item => ({
          ...item.MatchedObjectDescriptor,
          positionLocation: data.SearchResult.SearchResultItems
        }));
        this.log(`Fetched ${jobs.length} jobs from USAJobs`);
        return jobs;
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from USAJobs: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw USAJobs job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.PositionDescription || '';
    const salaryData = rawJob.PositionLocation?.length > 0 ? 
      this.parseSalary(rawJob.PositionLocation[0]?.UserArea?.Details?.PayPlan) : 
      { min: null, max: null, currency: 'USD' };

    return {
      platform: 'usajobs',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.PositionTitle,
      company: rawJob.DepartmentName || rawJob.AgencyMarketing?.BrandName || 'US Government',
      location: rawJob.PositionLocation?.[0]?.LocationName || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(rawJob),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.UserArea?.Details?.PayPlan?.[0]?.Rate?.[0]?.BasicSalary || null,
      salaryMin: rawJob.UserArea?.Details?.PayPlan?.[0]?.Rate?.[0]?.BasicSalary,
      salaryMax: rawJob.UserArea?.Details?.PayPlan?.[0]?.Rate?.[0]?.BasicSalary,
      employmentType: 'full-time', // Government jobs are typically full-time
      experienceLevel: this.normalizeExperienceLevel(rawJob.PositionTitle),
      workType: this.inferWorkType(rawJob),
      jobUrl: rawJob.PositionURI,
      postedDate: this.parseDate(rawJob.PositionStartDate),
      expiredDate: this.parseDate(rawJob.PositionEndDate),
      source: 'USAJobs',
      raw: rawJob
    };
  }

  /**
   * Clean HTML tags from description
   */
  cleanDescription(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Extract requirements from job data
   */
  extractRequirements(rawJob) {
    const requirements = [];
    
    // Basic requirements
    if (rawJob.UserArea?.Details?.Requirements) {
      const reqText = rawJob.UserArea.Details.Requirements;
      const lines = reqText.split('\n');
      for (const line of lines) {
        if (line.trim().length > 10 && line.trim().length < 500) {
          requirements.push(line.trim().replace(/^[-*•]\s*/, ''));
        }
      }
    }
    
    // Specialized experience
    if (rawJob.UserArea?.Details?.SpecializedExperience) {
      const expText = rawJob.UserArea.Details.SpecializedExperience;
      const lines = expText.split('\n');
      for (const line of lines) {
        if (line.trim().length > 10 && line.trim().length < 500) {
          requirements.push(line.trim().replace(/^[-*•]\s*/, ''));
        }
      }
    }
    
    // Education requirements
    if (rawJob.UserArea?.Details?.Education) {
      requirements.push(`Education: ${rawJob.UserArea.Details.Education}`);
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
    const keywords = ['responsib', 'you will', 'duties', 'tasks', 'major duties', 
                      'purpose of the position'];
    
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
  inferWorkType(rawJob) {
    const workSchedule = rawJob.UserArea?.Details?.WorkSchedule?.toLowerCase();
    if (workSchedule?.includes('remote') || workSchedule?.includes('telework')) {
      return 'remote';
    }
    if (workSchedule?.includes('hybrid')) {
      return 'hybrid';
    }
    return null;
  }
}

export default USAJobsProvider;