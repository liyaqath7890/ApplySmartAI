/**
 * CompanyConnectorService (v1.1 — Database-Driven)
 *
 * Orchestrates per-company job fetching via a dynamic ATS provider registry.
 * All company data is persisted in the `Company` table.
 * No hardcoded company-to-platform mappings.
 *
 * Provider Registry pattern:
 *   Any ATS adapter (Greenhouse, Lever, Ashby, Workday, etc.) implements BaseATSProvider
 *   and registers itself via CompanyConnectorService.registerProvider(platformKey, ProviderInstance).
 *
 * Sync Management:
 *   - Per-company TTL cache (in-memory)
 *   - Per-company health status tracked in the Company DB record
 *   - Paginated fetch support
 *   - Detailed sync logging stored in Company.syncLogs
 */

import { GreenhouseProvider } from './jobAggregation/providers/GreenhouseProvider.js';
import { LeverProvider }      from './jobAggregation/providers/LeverProvider.js';
import { AshbyProvider }      from './jobAggregation/providers/AshbyProvider.js';
import { TeamtailorProvider }  from './jobAggregation/providers/TeamtailorProvider.js';
import { SmartRecruitersProvider } from './jobAggregation/providers/SmartRecruitersProvider.js';
import { WorkdayProvider } from './jobAggregation/providers/WorkdayProvider.js';
import { OracleProvider } from './jobAggregation/providers/OracleProvider.js';
import { SAPSuccessFactorsProvider } from './jobAggregation/providers/SAPSuccessFactorsProvider.js';
import { DarwinboxProvider } from './jobAggregation/providers/DarwinboxProvider.js';
import { iCIMSProvider } from './jobAggregation/providers/iCIMSProvider.js';
import { TaleoProvider } from './jobAggregation/providers/TaleoProvider.js';
import { WorkableProvider } from './jobAggregation/providers/WorkableProvider.js';
import { RecruiteeProvider } from './jobAggregation/providers/RecruiteeProvider.js';
import { BambooHRProvider } from './jobAggregation/providers/BambooHRProvider.js';
import { JobviteProvider } from './jobAggregation/providers/JobviteProvider.js';
import { JazzHRProvider } from './jobAggregation/providers/JazzHRProvider.js';
import { PersonioProvider } from './jobAggregation/providers/PersonioProvider.js';
import { BreezyHRProvider } from './jobAggregation/providers/BreezyHRProvider.js';
import { FountainProvider } from './jobAggregation/providers/FountainProvider.js';
import { PinpointProvider } from './jobAggregation/providers/PinpointProvider.js';
import { ComeetProvider } from './jobAggregation/providers/ComeetProvider.js';
import { ZohoRecruitProvider } from './jobAggregation/providers/ZohoRecruitProvider.js';
import { RipplingProvider } from './jobAggregation/providers/RipplingProvider.js';
import jobQueueService        from './JobQueueService.js';
import jobAggregationService  from './jobAggregation/JobAggregationService.js';
import logger                 from '../utils/logger.js';
import LockService            from '../utils/LockService.js';
import auditLogger            from '../utils/auditLogger.js';
import sequelize              from '../config/database.js';

// ── Built-in provider instances ────────────────────────────────────────────────
const BUILTIN_PROVIDERS = {
  greenhouse: new GreenhouseProvider({}),
  lever:      new LeverProvider({}),
  ashby:      new AshbyProvider({}),
  teamtailor: new TeamtailorProvider({}),
  smartrecruiters: new SmartRecruitersProvider({}),
  workday: new WorkdayProvider({}),
  oracle: new OracleProvider({}),
  sap: new SAPSuccessFactorsProvider({}),
  darwinbox: new DarwinboxProvider({}),
  icims: new iCIMSProvider({}),
  taleo: new TaleoProvider({}),
  workable: new WorkableProvider({}),
  recruitee: new RecruiteeProvider({}),
  bamboohr: new BambooHRProvider({}),
  jobvite: new JobviteProvider({}),
  jazzhr: new JazzHRProvider({}),
  personio: new PersonioProvider({}),
  breezyhr: new BreezyHRProvider({}),
  fountain: new FountainProvider({}),
  pinpoint: new PinpointProvider({}),
  comeet: new ComeetProvider({}),
  zohorecruit: new ZohoRecruitProvider({}),
  rippling: new RipplingProvider({})
};

export class CompanyConnectorService {
  constructor({ cacheTTLMs = 60 * 60 * 1000 } = {}) {
    this.cacheTTLMs = cacheTTLMs;
    this.cache = new Map();    // key: `companyId:page` → { jobs, fetchedAt }
    this.providers = { ...BUILTIN_PROVIDERS };
  }

  /**
   * Register a new ATS provider at runtime.
   * @param {string} platform - e.g. 'workday', 'icims'
   * @param {BaseATSProvider} providerInstance
   */
  registerProvider(platform, providerInstance) {
    this.providers[platform] = providerInstance;
    logger.info(`CompanyConnector: registered provider → ${platform}`);
  }

  /**
   * Get a provider by platform key.
   * @param {string} platform
   */
  getProvider(platform) {
    const provider = this.providers[platform];
    if (!provider) throw new Error(`No provider registered for platform: "${platform}". Supported: ${Object.keys(this.providers).join(', ')}`);
    return provider;
  }

  /**
   * List all registered provider platform names.
   */
  listProviders() {
    return Object.keys(this.providers);
  }

  // ── Database-driven API ────────────────────────────────────────────────────

  /**
   * List all active companies from database.
   */
  async listCompanies(filters = {}) {
    const { Company } = await import('../routes/models/index.js');
    const { Op } = await import('sequelize');
    const where = { activeStatus: true };
    if (filters.industry) where.industry = filters.industry;
    if (filters.atsPlatform) where.atsPlatform = filters.atsPlatform;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    return Company.findAll({ where, order: [['name', 'ASC']] });
  }

  /**
   * Register (create) a new company in the database.
   */
  async registerCompany(data) {
    const { Company } = await import('../routes/models/index.js');
    if (!this.providers[data.atsPlatform]) {
      throw new Error(`Unknown ATS platform: "${data.atsPlatform}". Registered: ${Object.keys(this.providers).join(', ')}`);
    }
    const company = await Company.create(data);
    logger.info(`CompanyConnector: created company "${company.name}" (${company.atsPlatform})`);
    return company;
  }

  /**
   * Fetch jobs for a Company record (by DB id), with in-memory cache.
   */
  async fetchCompanyJobs(companyId, options = {}) {
    const { Company } = await import('../routes/models/index.js');
    const { page = 1, forceRefresh = false, keyword = '' } = options;
    const cacheKey = `${companyId}:${page}`;

    // Serve from cache if fresh
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < this.cacheTTLMs) {
        logger.info(`CompanyConnector: cache hit — ${companyId} (page ${page})`);
        return this._filterByKeyword(cached.jobs, keyword);
      }
    }

    const company = await Company.findByPk(companyId);
    if (!company) throw new Error(`Company not found: ${companyId}`);
    if (!company.atsPlatform) throw new Error(`Company "${company.name}" has no atsPlatform configured`);

    const provider = this.getProvider(company.atsPlatform);

    try {
      // Mark as syncing
      await company.update({ schedulerStatus: 'syncing' });

      const rawJobs = await provider.fetchCompanyJobs(company, { page, keyword });
      const jobs = (rawJobs || []).map(j => {
        try { return provider.normalizeJob(j); } catch { return null; }
      }).filter(Boolean);

      // Save jobs into database
      if (jobs.length > 0) {
        await jobAggregationService.saveJobs(jobs, null);
      }

      // Update cache
      this.cache.set(cacheKey, { jobs, fetchedAt: Date.now() });

      // Update company sync stats
      const now = new Date().toISOString();
      const existingLogs = company.syncLogs || [];
      const newLog = { timestamp: now, jobCount: jobs.length, status: 'success', page };
      await company.update({
        schedulerStatus: 'idle',
        lastSyncTime: now,
        lastSuccessfulSync: now,
        failedSyncCount: 0,
        activeJobs: jobs.length,
        syncLogs: [...existingLogs.slice(-49), newLog] // Keep last 50 logs
      });

      logger.info(`CompanyConnector: "${company.name}" (${company.atsPlatform}) — ${jobs.length} jobs (page ${page})`);
      return this._filterByKeyword(jobs, keyword);
    } catch (err) {
      const now = new Date().toISOString();
      const existingLogs = company.syncLogs || [];
      const newLog = { timestamp: now, status: 'failed', error: err.message, page };
      await company.update({
        schedulerStatus: 'failed',
        failedSyncCount: (company.failedSyncCount || 0) + 1,
        syncLogs: [...existingLogs.slice(-49), newLog]
      });

      logger.error(`CompanyConnector: "${company.name}" sync failed — ${err.message}`);
      throw err;
    }
  }

  /**
   * Fetch all pages for a company (full paginated sync).
   */
  async fetchAllPages(companyId, options = {}) {
    const { maxPages = 10, keyword = '', forceRefresh = false } = options;
    const allJobs = [];
    for (let page = 1; page <= maxPages; page++) {
      try {
        const jobs = await this.fetchCompanyJobs(companyId, { page, keyword, forceRefresh });
        if (!jobs.length) break;
        allJobs.push(...jobs);
        if (jobs.length < 20) break; // Likely last page
      } catch {
        break;
      }
    }
    return allJobs;
  }

  /**
   * Sync all active companies that are due for a sync.
   * Called by SchedulerService.
   */
  async syncDueCompanies() {
    // 1. Acquire distributed system lock to prevent concurrent overlaps
    const lockAcquired = await LockService.acquire('sync_due_companies', 1800000); // 30 min lock max
    if (!lockAcquired) {
      logger.warn('[CompanyConnectorService] syncDueCompanies skipped: Could not acquire lock.');
      return [];
    }

    auditLogger.log('SYNC_START', null, { message: 'Initiated scheduler-due company synchronization' });

    try {
      const { Company } = await import('../routes/models/index.js');
      const now = Date.now();
      const companies = await Company.findAll({ where: { activeStatus: true, schedulerStatus: ['idle', 'failed'] } });

      const results = [];
      for (const company of companies) {
        const syncIntervalMs = this._syncFrequencyToMs(company.syncFrequency);
        const lastSync = company.lastSyncTime ? new Date(company.lastSyncTime).getTime() : 0;
        if (now - lastSync < syncIntervalMs) continue; // Not due yet

        // Use transaction to ensure safe updates to database records
        const t = await sequelize.transaction();
        try {
          auditLogger.log('COMPANY_SYNC_START', null, { companyId: company.id, name: company.name });
          
          const jobs = await this.fetchCompanyJobs(company.id, { forceRefresh: true });
          
          if (jobs && jobs.length > 0) {
            await jobQueueService.dispatchCompanyJobAlerts(company, jobs);
          }

          await company.update({
            lastSyncTime: new Date(),
            schedulerStatus: 'idle',
            syncStatus: 'healthy'
          }, { transaction: t });

          await t.commit();
          results.push({ companyId: company.id, name: company.name, jobCount: jobs.length, status: 'success' });
          auditLogger.log('COMPANY_SYNC_SUCCESS', null, { companyId: company.id, name: company.name, jobCount: jobs.length });
        } catch (err) {
          await t.rollback();
          results.push({ companyId: company.id, name: company.name, error: err.message, status: 'failed' });
          auditLogger.log('COMPANY_SYNC_FAILED', null, { companyId: company.id, name: company.name, error: err.message });
          
          // Update status to failed
          await company.update({
            schedulerStatus: 'failed',
            syncStatus: 'degraded'
          }).catch(() => {});
        }
      }

      auditLogger.log('SYNC_COMPLETE', null, { successCount: results.filter(r => r.status === 'success').length });
      return results;
    } finally {
      // 2. Always release the lock
      await LockService.release('sync_due_companies');
    }
  }

  /**
   * Health status for all active companies (from DB).
   */
  async getHealthStatus() {
    const { Company } = await import('../routes/models/index.js');
    const companies = await Company.findAll({ attributes: ['id', 'name', 'atsPlatform', 'schedulerStatus', 'lastSyncTime', 'lastSuccessfulSync', 'failedSyncCount', 'activeJobs'] });
    const healthy = companies.filter(c => c.schedulerStatus === 'idle').length;
    const failed  = companies.filter(c => c.schedulerStatus === 'failed').length;
    return {
      total: companies.length,
      healthy,
      failed,
      companies: companies.map(c => c.toJSON())
    };
  }

  /**
   * Clear in-memory cache for a specific company or all.
   */
  clearCache(companyId = null) {
    if (companyId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${companyId}:`)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
    logger.info(`CompanyConnector: cache cleared${companyId ? ` for ${companyId}` : ''}`);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  _filterByKeyword(jobs, keyword) {
    if (!keyword) return jobs;
    const kw = keyword.toLowerCase();
    return jobs.filter(j =>
      (j.title || '').toLowerCase().includes(kw) ||
      (j.description || '').toLowerCase().includes(kw) ||
      (j.company || '').toLowerCase().includes(kw)
    );
  }

  _syncFrequencyToMs(frequency) {
    switch (frequency) {
      case 'hourly':  return 60 * 60 * 1000;
      case 'daily':   return 24 * 60 * 60 * 1000;
      case 'weekly':  return 7 * 24 * 60 * 60 * 1000;
      default:        return 24 * 60 * 60 * 1000;
    }
  }
}

export default new CompanyConnectorService();
