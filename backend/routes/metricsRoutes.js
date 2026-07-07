/**
 * Metrics & Observability Routes
 *
 * GET /api/metrics          — application metrics (admin only)
 * GET /api/metrics/queues   — BullMQ queue dashboard data (admin only)
 * GET /api/metrics/storage  — storage provider stats (admin only)
 * GET /api/health           — basic health (public — already in server.js, kept here for completeness)
 * GET /api/health/detailed  — detailed health with checks (admin)
 * GET /api/health/ready     — Kubernetes readiness probe
 * GET /api/health/live      — Kubernetes liveness probe
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { getHealthStatus, readinessCheck, livenessCheck } from '../middleware/healthCheck.js';
import JobQueueService from '../services/JobQueueService.js';
import StorageService from '../services/StorageService.js';
import SchedulerService from '../services/SchedulerService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ── Health probes (public / lightweight) ─────────────────────────────────────

router.get('/health/live',  livenessCheck);
router.get('/health/ready', readinessCheck);

// ── Detailed health (authenticated) ──────────────────────────────────────────

router.get('/health/detailed', protect, requirePermission('admin:metrics'), async (req, res) => {
  try {
    const health = await getHealthStatus(true);
    const code = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(code).json(health);
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

// ── Application Metrics ───────────────────────────────────────────────────────

router.get('/metrics', protect, requirePermission('admin:metrics'), async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const [queueStats, storageStats, schedulerStatus] = await Promise.allSettled([
      JobQueueService.getQueueStats(),
      StorageService.getStats(),
      Promise.resolve(SchedulerService.getStatus()),
    ]);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      process: {
        pid:    process.pid,
        uptime: Math.round(process.uptime()),
        version: process.version,
        platform: process.platform,
        memory: {
          rss:        toMB(memUsage.rss),
          heapTotal:  toMB(memUsage.heapTotal),
          heapUsed:   toMB(memUsage.heapUsed),
          external:   toMB(memUsage.external),
          heapUsedPct: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        },
      },
      queues:    queueStats.status === 'fulfilled' ? queueStats.value : { error: 'unavailable' },
      storage:   storageStats.status === 'fulfilled' ? storageStats.value : { error: 'unavailable' },
      scheduler: schedulerStatus.status === 'fulfilled' ? schedulerStatus.value : { error: 'unavailable' },
      env: {
        nodeEnv: process.env.NODE_ENV,
        port:    process.env.PORT || 5000,
      },
    });
  } catch (err) {
    logger.error(`Metrics endpoint error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Queue Dashboard ───────────────────────────────────────────────────────────

router.get('/metrics/queues', protect, requirePermission('admin:queues'), async (req, res) => {
  try {
    if (!JobQueueService.initialized) {
      return res.json({
        success: true,
        initialized: false,
        message: 'Queue service not initialised (Redis may be unavailable)',
        queues: {},
      });
    }

    const stats = await JobQueueService.getQueueStats();

    res.json({
      success: true,
      initialized: true,
      timestamp: new Date().toISOString(),
      healthy: await JobQueueService.isHealthy(),
      ...stats,
    });
  } catch (err) {
    logger.error(`Queue metrics error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Queue management (admin) ──────────────────────────────────────────────────

router.post('/metrics/queues/:queueName/retry-failed', protect, requirePermission('admin:queues'), async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = JobQueueService.queues?.[queueName];

    if (!queue) {
      return res.status(404).json({ success: false, error: `Queue '${queueName}' not found` });
    }

    const failedJobs = await queue.getFailed();
    let retried = 0;

    for (const job of failedJobs) {
      await job.retry();
      retried++;
    }

    res.json({ success: true, queueName, retriedJobs: retried });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/metrics/queues/:queueName/clean', protect, requirePermission('admin:queues'), async (req, res) => {
  try {
    const { queueName } = req.params;
    const { olderThanMs = 24 * 60 * 60 * 1000, status = 'completed' } = req.body;
    const queue = JobQueueService.queues?.[queueName];

    if (!queue) {
      return res.status(404).json({ success: false, error: `Queue '${queueName}' not found` });
    }

    const removed = await queue.clean(olderThanMs, 100, status);
    res.json({ success: true, queueName, removed: removed.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Storage Stats ─────────────────────────────────────────────────────────────

router.get('/metrics/storage', protect, requirePermission('admin:metrics'), async (req, res) => {
  try {
    const stats = await StorageService.getStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Scheduler Status ──────────────────────────────────────────────────────────

router.get('/metrics/scheduler', protect, requirePermission('admin:queues'), (req, res) => {
  res.json({ success: true, ...SchedulerService.getStatus() });
});

// ── Audit Logs (admin) ────────────────────────────────────────────────────────

router.get('/metrics/audit', protect, requirePermission('admin:audit'), async (req, res) => {
  try {
    const { page = 1, limit = 50, entityType, action } = req.query;
    const AuditLogService = (await import('../services/AuditLogService.js')).default;

    const logs = action
      ? await AuditLogService.getLogsByAction(action, { limit: parseInt(limit), offset: (page - 1) * limit })
      : await AuditLogService.getUserLogs(req.query.userId, { limit: parseInt(limit), offset: (page - 1) * limit });

    const stats = await AuditLogService.getStatistics({ entityType });

    res.json({ success: true, logs, stats, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Observability Dashboard ──────────────────────────────────────────────────

router.get('/metrics/dashboard', protect, requirePermission('admin:metrics'), async (req, res) => {
  try {
    const { Company, ExternalJob, Notification } = await import('./models/index.js');
    const { Op } = await import('sequelize');

    // 1. Company Statistics & Sync Status & Provider Health
    const companies = await Company.findAll();
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.activeStatus).length;
    
    const hiringStatusBreakdown = {
      activelyHiring: companies.filter(c => c.hiringStatus === 'Actively Hiring').length,
      hiringFreeze: companies.filter(c => c.hiringStatus === 'Hiring Freeze').length,
      unknown: companies.filter(c => c.hiringStatus === 'Unknown').length
    };

    const syncStatus = {
      idle: companies.filter(c => c.schedulerStatus === 'idle').length,
      syncing: companies.filter(c => c.schedulerStatus === 'syncing').length,
      failed: companies.filter(c => c.schedulerStatus === 'failed').length,
      queued: companies.filter(c => c.schedulerStatus === 'queued').length
    };

    const providerHealth = {};
    const providers = ['greenhouse', 'lever', 'ashby', 'teamtailor', 'smartrecruiters'];
    for (const prov of providers) {
      const provCompanies = companies.filter(c => c.atsPlatform === prov);
      const healthy = provCompanies.every(c => c.schedulerStatus !== 'failed');
      const failedSyncs = provCompanies.reduce((acc, c) => acc + (c.failedSyncCount || 0), 0);
      const totalJobs = provCompanies.reduce((acc, c) => acc + (c.activeJobs || 0), 0);
      providerHealth[prov] = {
        configuredCompanies: provCompanies.length,
        status: provCompanies.length === 0 ? 'inactive' : healthy ? 'healthy' : 'degraded',
        failedSyncs,
        totalJobs
      };
    }

    // 2. Job Statistics
    const totalJobs = await ExternalJob.count();
    const activeJobs = await ExternalJob.count({ where: { isExpired: false } });
    const expiredJobs = await ExternalJob.count({ where: { isExpired: true } });
    
    // Group by platform
    const platformBreakdown = {};
    const platformCounts = await ExternalJob.findAll({
      attributes: ['platform', [ExternalJob.sequelize.fn('COUNT', ExternalJob.sequelize.col('platform')), 'count']],
      group: ['platform']
    });
    for (const pc of platformCounts) {
      platformBreakdown[pc.platform] = parseInt(pc.dataValues.count);
    }

    // 3. Queue Status
    const queueStats = JobQueueService.initialized 
      ? await JobQueueService.getQueueStats()
      : { initialized: false };

    // 4. Notifications Delivery
    const totalNotifications = await Notification.count();
    const readNotifications = await Notification.count({ where: { isRead: true } });
    const unreadNotifications = totalNotifications - readNotifications;
    const deliveryRatio = totalNotifications > 0 ? (readNotifications / totalNotifications).toFixed(2) : 1.0;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dashboard: {
        providerHealth,
        syncStatus: {
          totalCompanies,
          activeCompanies,
          syncStatus,
          hiringStatusBreakdown
        },
        jobs: {
          totalJobs,
          activeJobs,
          expiredJobs,
          platformBreakdown
        },
        queues: queueStats,
        notifications: {
          total: totalNotifications,
          read: readNotifications,
          unread: unreadNotifications,
          deliveryRatio
        }
      }
    });
  } catch (err) {
    logger.error(`Dashboard metrics endpoint error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default router;
