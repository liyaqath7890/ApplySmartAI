import { BaseJobProvider } from './BaseProvider.js';
import Parser from 'rss-parser';

/**
 * RSS Feed Job Aggregator
 * Fetches jobs from company and job board RSS feeds
 */
export class RSSFeedProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.parser = new Parser({
      customFields: {
        item: [
          ['location', 'location'],
          ['employment_type', 'employmentType'],
          ['salary', 'salary'],
          ['company', 'company'],
          ['category', 'category'],
          ['description', 'description'],
          ['requirements', 'requirements'],
          ['experience', 'experienceLevel']
        ]
      }
    });
    this.feeds = adapterConfig.feeds || this.getDefaultFeeds();
  }

  /**
   * Get default RSS feeds to monitor
   */
  getDefaultFeeds() {
    return [
      // Tech job boards
      { url: 'https://news.ycombinator.com/jobs.rss', name: 'HackerNews Jobs', category: 'tech' },
      { url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss', name: 'We Work Remotely', category: 'remote' },
      { url: 'https://stackoverflow.com/jobs/feed', name: 'Stack Overflow Jobs', category: 'tech' },
      
      // Company career pages (examples)
      { url: 'https://www.google.com/about/careers/applications/feeds/v3/', name: 'Google Careers', category: 'tech' },
      { url: 'https://www.microsoft.com/en-us/careers/feed/', name: 'Microsoft Careers', category: 'tech' },
      { url: 'https://www.amazon.jobs/en/search.rss', name: 'Amazon Jobs', category: 'tech' },
      
      // General job feeds
      { url: 'https://www.indeed.com/rss?q=software+engineer', name: 'Indeed Software Engineer', category: 'tech' },
      { url: 'https://www.monster.com/jobs/search/rss?q=software+developer', name: 'Monster Software Developer', category: 'tech' }
    ];
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return true;
  }

  /**
   * Add a custom RSS feed to monitor
   */
  addFeed(feedConfig) {
    if (!this.feeds.find(f => f.url === feedConfig.url)) {
      this.feeds.push(feedConfig);
    }
  }

  /**
   * Remove a feed from monitoring
   */
  removeFeed(feedUrl) {
    this.feeds = this.feeds.filter(f => f.url !== feedUrl);
  }

  /**
   * Fetch jobs from RSS feeds
   */
  async fetchJobs(searchParams = {}) {
    try {
      const {
        keyword = '',
        feeds = this.feeds,
        maxFeeds = 10
      } = searchParams;

      const feedsToFetch = feeds.slice(0, maxFeeds);
      const allJobs = [];

      for (const feed of feedsToFetch) {
        try {
          const feedData = await this.parser.parseURL(feed.url);
          
          for (const item of feedData.items) {
            const job = {
              ...item,
              feedName: feed.name,
              feedCategory: feed.category,
              feedUrl: feed.url
            };
            
            // Filter by keyword if provided
            if (keyword && !this.matchesKeyword(job, keyword)) {
              continue;
            }
            
            allJobs.push(job);
          }
          
          this.log(`Fetched ${feedData.items.length} jobs from ${feed.name}`);
        } catch (error) {
          this.log(`Error fetching feed ${feed.name}: ${error.message}`, 'warn');
        }
      }

      return allJobs;
    } catch (error) {
      this.log(`Error fetching RSS feeds: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Check if job matches keyword
   */
  matchesKeyword(job, keyword) {
    const keywordLower = keyword.toLowerCase();
    const searchFields = [
      job.title,
      job.description,
      job.content,
      job.company,
      job.location,
      job.category
    ].filter(Boolean);

    return searchFields.some(field => 
      field.toLowerCase().includes(keywordLower)
    );
  }

  /**
   * Normalize a raw RSS job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.description || rawJob.content || rawJob.contentSnippet || '';
    const textContent = this.extractTextContent(description);

    return {
      platform: 'rss',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.company || rawJob.company || this.extractCompanyFromTitle(rawJob.title) || 'Confidential',
      location: rawJob.location || rawJob.location || this.extractLocationFromDescription(textContent) || '',
      description: textContent,
      requirements: this.extractRequirements(textContent),
      responsibilities: this.extractResponsibilities(textContent),
      salary: rawJob.salary || null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType),
      experienceLevel: this.normalizeExperienceLevel(rawJob.experienceLevel || rawJob.title),
      workType: this.inferWorkType(rawJob, textContent),
      jobUrl: rawJob.link || rawJob.url,
      postedDate: this.parseDate(rawJob.pubDate || rawJob.isoDate || rawJob.created),
      source: rawJob.feedName || 'RSS Feed',
      raw: rawJob
    };
  }

  /**
   * Extract text content from HTML
   */
  extractTextContent(html) {
    if (!html) return '';
    
    if (!html.includes('<')) return html;
    
    return html
      .replace(/<[^>]*>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/"/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract company name from job title
   */
  extractCompanyFromTitle(title) {
    if (!title) return null;
    
    // Common patterns like "Software Engineer at Company"
    const atMatch = title.match(/at\s+([^|]+?)(?:\||$)/i);
    if (atMatch) return atMatch[1].trim();
    
    // Pattern like "Company - Software Engineer"
    const dashMatch = title.match(/^([^|]+?)\s*[-|]/);
    if (dashMatch) return dashMatch[1].trim();
    
    return null;
  }

  /**
   * Extract location from description
   */
  extractLocationFromDescription(description) {
    if (!description) return null;
    
    // Look for common location patterns
    const locationPatterns = [
      /(?:located?|based?|location)[:\s]+([^,\n]+)/i,
      /(?:remote|onsite|hybrid)[:\s]+([^,\n]+)/i,
      /\b(San\s+Francisco|New\s+York|London|Berlin|Remote|Worldwide)\b/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }

  /**
   * Extract requirements from description
   */
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

  /**
   * Extract responsibilities from description
   */
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

  /**
   * Infer work type from job data
   */
  inferWorkType(rawJob, description) {
    const descLower = description.toLowerCase();
    
    if (rawJob.title?.toLowerCase().includes('remote') || 
        rawJob.category?.toLowerCase().includes('remote') ||
        descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh') || descLower.includes('distributed')) {
      return 'remote';
    }
    
    if (descLower.includes('hybrid')) return 'hybrid';
    if (descLower.includes('on-site') || descLower.includes('office')) return 'on-site';
    
    return null;
  }
}

export default RSSFeedProvider;