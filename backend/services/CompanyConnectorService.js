/**
 * CompanyConnectorService
 *
 * Orchestrates per-company job fetching across Greenhouse, Lever and Ashby.
 * Each connector supports: fetch, normalize, cache, retry, log, health check, pagination.
 *
 * This service is a thin orchestration layer on top of the existing providers.
 * It adds:
 *   • In-memory TTL cache per company (configurable, default 1 hour)
 *   • Per-company health status tracking
 *   • Paginated fetch support
 *   • Detailed per-connector logging
 */

import { GreenhouseProvider } from './jobAggregation/providers/GreenhouseProvider.js';
import { LeverProvider }      from './jobAggregation/providers/LeverProvider.js';
import { AshbyProvider }      from './jobAggregation/providers/AshbyProvider.js';
import logger                 from '../utils/logger.js';

// ── Connector registry ─────────────────────────────────────────────────────────

const PLATFORM_PROVIDERS = {
  greenhouse: GreenhouseProvider,
  lever:      LeverProvider,
  ashby:      AshbyProvider,
};

// Company → platform mapping (extend via addCompany / config file)
const DEFAULT_COMPANIES = {
  // Greenhouse
  airbnb:     'greenhouse',
  lyft:       'greenhouse',
  shopify:    'greenhouse',
  stripe:     'greenhouse',
  square:     'greenhouse',
  doordash:   'greenhouse',
  coinbase:   'greenhouse',
  robinhood:  'greenhouse',
  brex:       'greenhouse',
  plaid:      'greenhouse',

  // Lever
  coursera:   'lever',
  figma:      'lever',
  canva:      'lever',
  notion:     'lever',
  airtable:   'lever',
  zapier:     'lever',
  hubspot:    'lever',
  asana:      'lever',

  // Ashby
  linear:     'ashby',
  vercel:     'ashby',
  supabase:   'ashby',
  clerk:      'ashby',
  resend:     'ashby',
  calcom:     'ashby',
};

export class CompanyConnectorService {
  constructor({ cacheTTLMs = 60 * 60 * 1000 } = {}) {
    this.cacheTTLMs = cacheTTLMs;
    this.cache = new Map();       // key → { jobs, fetchedAt }
    this.health = new Map();      // companyId → { status, lastChecked, error }
    this.companies = { ...DEFAULT_COMPANIES };

    // Instantiate one provider per platform (shared, stateless)
    this.providers = {};
    for (const [platform, ProviderClass] of Object.entries(PLATFORM_PROVIDERS)) {
      this.providers[platform] = new ProviderClass({});
    }
  }

  /**
   * Add or override a company → platform mapping.
   */
  addCompany(companyId, platform) {
    if (!PLATFORM_PROVIDERS[platform]) {
      throw new Error(`Unknown platform: ${platform}. Supported: ${Object.keys(PLATFORM_PROVIDERS).join(', ')}`);
    }
    this.companies[companyId] = platform;
    logger.info(`CompanyConnector: registered ${companyId} → ${platform}`);
  }

  /**
   * Fetch jobs for a single company, with caching.
   *
   * @param {string} companyId   — e.g. 'stripe', 'linear'
   * @param {object} options     — { page, forceRefresh, keyword }
   * @returns {Promise<object[]>} Normalised job objects
   */
  async fetchCompanyJobs(companyId, options = {}) {
    const { page = 1, forceRefresh = false, keyword = '' } = options;
    const cacheKey = `${companyId}:${page}`;

    // Serve from cache if fresh
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < this.cacheTTLMs) {
        logger.info(`CompanyConnector: cache hit for ${companyId} (page ${page})`);
        return this._filterByKeyword(cached.jobs, keyword);
      }
    }

    const platform = this.companies[companyId];
    if (!platform) {
      throw new Error(`Unknown company: ${companyId}. Register it with addCompany().`);
    }

    const provider = this.providers[platform];

    try {
      const raw = await provider.fetchCompanyJobs(companyId, { page, keyword });
      const jobs = (raw || []).map(j => {
        try { return provider.normalizeJob(j); } catch { return null; }
      }).filter(Boolean);

      // Update cache
      this.cache.set(cacheKey, { jobs, fetchedAt: Date.now() });

      // Mark healthy
      this.health.set(companyId, {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        jobCount: jobs.length,
        platform,
      });

      logger.info(`CompanyConnector: ${companyId} (${platform}) — ${jobs.length} jobs (page ${page})`);
      return this._filterByKeyword(jobs, keyword);
    } catch (err) {
      this.health.set(companyId, {
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        error: err.message,
        platform,
      });

      logger.error(`CompanyConnector: ${companyId} failed — ${err.message}`);
      throw err;
    }
  }

  /**
   * Fetch all pages for a company (full paginated sync).
   *
   * @param {string} companyId
   * @param {object} options  — { maxPages, keyword, forceRefresh }
   * @returns {Promise<object[]>}
   */
  async fetchAllPages(companyId, options = {}) {
    const { maxPages = 10, keyword = '', forceRefresh = false } = options;
    const allJobs = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        const jobs = await this.fetchCompanyJobs(companyId, { page, keyword, forceRefresh });
        if (!jobs.length) break; // No more pages
        allJobs.push(...jobs);
        if (jobs.length < 20) break; // Likely last page
      } catch {
        break; // Stop on error but return what we have
      }
    }

    return allJobs;
  }

  /**
   * Fetch jobs from all registered companies.
   *
   * @param {object} options — { platforms, keyword, maxConcurrency }
   * @returns {Promise<object[]>}
   */
  async fetchAllCompanies(options = {}) {
    const { platforms = null, keyword = '', maxConcurrency = 5 } = options;

    const companies = Object.entries(this.companies)
      .filter(([, platform]) => !platforms || platforms.includes(platform))
      .map(([companyId]) => companyId);

    const allJobs = [];
    const batches = chunk(companies, maxConcurrency);

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(companyId => this.fetchCompanyJobs(companyId, { keyword }))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value);
        }
      }
    }

    return allJobs;
  }

  /**
   * Health status for all companies.
   */
  getHealthStatus() {
    const status = {};
    for (const [companyId, platform] of Object.entries(this.companies)) {
      status[companyId] = this.health.get(companyId) || {
        status: 'unknown',
        platform,
        lastChecked: null,
      };
    }
    return {
      total: Object.keys(this.companies).length,
      healthy: [...this.health.values()].filter(h => h.status === 'healthy').length,
      unhealthy: [...this.health.values()].filter(h => h.status === 'unhealthy').length,
      companies: status,
    };
  }

  /**
   * Clear cache for a company or all companies.
   */
  clearCache(companyId = null) {
    if (companyId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${companyId}:`)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * List all registered companies.
   */
  listCompanies() {
    return Object.entries(this.companies).map(([id, platform]) => ({ id, platform }));
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _filterByKeyword(jobs, keyword) {
    if (!keyword) return jobs;
    const kw = keyword.toLowerCase();
    return jobs.filter(j =>
      (j.title || '').toLowerCase().includes(kw) ||
      (j.description || '').toLowerCase().includes(kw) ||
      (j.company || '').toLowerCase().includes(kw)
    );
  }
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export default new CompanyConnectorService();
