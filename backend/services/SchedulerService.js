import cron from 'node-cron';
import logger from '../utils/logger.js';
import JobQueueService from './JobQueueService.js';

/**
 * SchedulerService
 *
 * Manages all recurring background jobs using node-cron.
 * Each schedule adds a job to the appropriate BullMQ queue —
 * it does NOT execute business logic directly.
 *
 * Schedules:
 *  • 15 min  — Fast job sync (Arbeitnow, RemoteOK, Remotive, RSS)
 *  •  1 hr   — Medium cadence (Adzuna, JSearch, Wellfound)
 *  •  6 hrs  — Slow sync (Greenhouse, Lever, Ashby, USAJobs)
 *  • 24 hrs  — Daily digest emails + full aggregation
 *
 * All tasks are idempotent and enqueued — never run inline.
 */
export class SchedulerService {
  constructor() {
    this.tasks = new Map();
    this.started = false;
  }

  /**
   * Start all scheduled tasks.
   * Safe to call multiple times — guards against double-start.
   */
  start() {
    if (this.started) {
      logger.warn('SchedulerService already started, skipping');
      return;
    }

    this._schedule15Min();
    this._schedule1Hour();
    this._schedule6Hours();
    this._schedule24Hours();
    this._scheduleCompanySync();  // v1.1 DB-driven

    this.started = true;
    logger.info(`SchedulerService started — ${this.tasks.size} tasks active`);
  }

  /**
   * Stop all scheduled tasks gracefully.
   */
  stop() {
    for (const [name, task] of this.tasks.entries()) {
      task.stop();
      logger.info(`Scheduler stopped: ${name}`);
    }
    this.tasks.clear();
    this.started = false;
    logger.info('SchedulerService stopped');
  }

  // ── 15-minute sync (fast, free APIs) ─────────────────────────────────────

  _schedule15Min() {
    const task = cron.schedule('*/15 * * * *', async () => {
      logger.info('[CRON-15m] Running fast job sync');
      await this._enqueueJobSync({
        providers: ['arbeitnow', 'remoteok', 'remotive', 'rss'],
        label: 'fast-sync-15m',
      });
    }, { timezone: 'UTC' });

    this.tasks.set('fast-sync-15m', task);
  }

  // ── 1-hour sync (API-key providers) ──────────────────────────────────────

  _schedule1Hour() {
    const task = cron.schedule('0 * * * *', async () => {
      logger.info('[CRON-1h] Running medium job sync');
      await this._enqueueJobSync({
        providers: ['adzuna', 'jsearch', 'wellfound', 'arbeitnow'],
        label: 'medium-sync-1h',
      });
    }, { timezone: 'UTC' });

    this.tasks.set('medium-sync-1h', task);
  }

  // ── 6-hour sync (company career pages) ───────────────────────────────────

  _schedule6Hours() {
    const task = cron.schedule('0 */6 * * *', async () => {
      logger.info('[CRON-6h] Running company career page sync');
      await this._enqueueJobSync({
        providers: ['greenhouse', 'lever', 'ashby', 'usajobs'],
        label: 'company-sync-6h',
      });
    }, { timezone: 'UTC' });

    this.tasks.set('company-sync-6h', task);
  }

  // ── 24-hour full sync + digest emails ────────────────────────────────────

  _schedule24Hours() {
    // Full aggregation at 02:00 UTC daily
    const fullSyncTask = cron.schedule('0 2 * * *', async () => {
      logger.info('[CRON-24h] Running full job aggregation');
      await this._enqueueJobSync({
        providers: null, // null = all providers
        label: 'full-sync-24h',
      });
    }, { timezone: 'UTC' });

    // Daily digest emails at 08:00 UTC
    const dailyDigestTask = cron.schedule('0 8 * * *', async () => {
      logger.info('[CRON-24h] Enqueueing daily digest emails');
      await this._enqueueDailyDigests();
    }, { timezone: 'UTC' });

    // Weekly summary emails every Monday at 09:00 UTC
    const weeklySummaryTask = cron.schedule('0 9 * * 1', async () => {
      logger.info('[CRON-weekly] Enqueueing weekly summary emails');
      await this._enqueueWeeklySummaries();
    }, { timezone: 'UTC' });

    // Expired job cleanup at 03:00 UTC daily
    const cleanupTask = cron.schedule('0 3 * * *', async () => {
      logger.info('[CRON-24h] Running expired job cleanup');
      await this._enqueueExpiredJobCleanup();
    }, { timezone: 'UTC' });

    this.tasks.set('full-sync-24h', fullSyncTask);
    this.tasks.set('daily-digest', dailyDigestTask);
    this.tasks.set('weekly-summary', weeklySummaryTask);
    this.tasks.set('expired-cleanup', cleanupTask);
  }

  // ── Queue helpers ─────────────────────────────────────────────────────────

  // ── DB-driven company sync (v1.1) ─────────────────────────────────────

  _scheduleCompanySync() {
    // Runs every 30 minutes; syncDueCompanies() only syncs companies whose
    // individual syncFrequency TTL has expired.
    const task = cron.schedule('*/30 * * * *', async () => {
      logger.info('[CRON-company-sync] Running DB-driven company sync');
      try {
        // Lazy import to avoid circular deps at startup
        const { default: connectorService } = await import('./CompanyConnectorService.js');
        const results = await connectorService.syncDueCompanies();
        const success = results.filter(r => r.status === 'success').length;
        const failed  = results.filter(r => r.status === 'failed').length;
        logger.info(`[CRON-company-sync] Done — ${success} synced, ${failed} failed`);
      } catch (err) {
        logger.error(`[CRON-company-sync] Error: ${err.message}`);
      }
    }, { timezone: 'UTC' });

    this.tasks.set('company-db-sync-30m', task);
  }

  async _enqueueJobSync({ providers, label }) {
    if (!JobQueueService.initialized) {
      logger.warn(`[Scheduler] Queue not ready, skipping ${label}`);
      return;
    }

    try {
      await JobQueueService.queues.jobAggregation?.add(
        'scheduled-sync',
        {
          providers,
          label,
          scheduledAt: new Date().toISOString(),
          // No candidateId = system-wide sync
          systemWide: true,
        },
        {
          jobId: `${label}-${Date.now()}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
        }
      );
      logger.info(`[Scheduler] Enqueued ${label}`);
    } catch (err) {
      logger.error(`[Scheduler] Failed to enqueue ${label}: ${err.message}`);
    }
  }

  async _enqueueDailyDigests() {
    if (!JobQueueService.initialized) return;

    try {
      await JobQueueService.queues.emailDigests?.add(
        'send-daily-digest-batch',
        { type: 'daily', scheduledAt: new Date().toISOString() },
        { jobId: `daily-digest-batch-${Date.now()}`, attempts: 3 }
      );
    } catch (err) {
      logger.error(`[Scheduler] Failed to enqueue daily digest: ${err.message}`);
    }
  }

  async _enqueueWeeklySummaries() {
    if (!JobQueueService.initialized) return;

    try {
      await JobQueueService.queues.emailDigests?.add(
        'send-weekly-summary-batch',
        { type: 'weekly', scheduledAt: new Date().toISOString() },
        { jobId: `weekly-summary-batch-${Date.now()}`, attempts: 3 }
      );
    } catch (err) {
      logger.error(`[Scheduler] Failed to enqueue weekly summary: ${err.message}`);
    }
  }

  async _enqueueExpiredJobCleanup() {
    if (!JobQueueService.initialized) return;

    try {
      await JobQueueService.queues.jobAggregation?.add(
        'cleanup-expired-jobs',
        { type: 'cleanup', scheduledAt: new Date().toISOString() },
        { jobId: `cleanup-expired-${Date.now()}`, attempts: 2 }
      );
    } catch (err) {
      logger.error(`[Scheduler] Failed to enqueue cleanup: ${err.message}`);
    }
  }

  /**
   * Return status of all scheduled tasks.
   */
  getStatus() {
    const status = {};
    for (const [name, task] of this.tasks.entries()) {
      status[name] = { running: true }; // node-cron tasks are always "running" once started
    }
    return {
      started: this.started,
      taskCount: this.tasks.size,
      tasks: status,
    };
  }
}

export default new SchedulerService();
