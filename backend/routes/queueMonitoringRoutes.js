import express from 'express';
import JobQueueService from '../services/JobQueueService.js';
import AuditLogService from '../services/AuditLogService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/queues/status
 * Get overall queue system status
 */
router.get('/status', async (req, res) => {
  try {
    const queueService = JobQueueService.getInstance();
    
    const status = {
      initialized: queueService.initialized,
      queues: {},
      workers: {},
      timestamp: new Date().toISOString()
    };

    // Get queue status for each queue
    for (const [queueName, queue] of Object.entries(queueService.queues || {})) {
      if (queue) {
        const counts = await queue.getJobCounts();
        status.queues[queueName] = {
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed
        };
      }
    }

    // Get worker status
    for (const [workerName, worker] of Object.entries(queueService.workers || {})) {
      if (worker) {
        status.workers[workerName] = {
          running: !worker.isClosing()
        };
      }
    }

    res.json(status);
  } catch (error) {
    logger.error(`Queue status error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

/**
 * GET /api/queues/:queueName
 * Get detailed status for a specific queue
 */
router.get('/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const queueService = JobQueueService.getInstance();
    
    const queue = queueService.queues[queueName];
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const counts = await queue.getJobCounts();
    const jobs = await queue.getJobs([ 'waiting', 'active', 'completed', 'failed' ], 0, 10);

    res.json({
      queueName,
      counts,
      recentJobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
      }))
    });
  } catch (error) {
    logger.error(`Queue detail error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get queue details' });
  }
});

/**
 * GET /api/queues/:queueName/jobs
 * Get jobs from a specific queue with filtering
 */
router.get('/:queueName/jobs', async (req, res) => {
  try {
    const { queueName } = req.params;
    const { state = 'waiting', start = 0, end = 20 } = req.query;
    
    const queueService = JobQueueService.getInstance();
    const queue = queueService.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const jobs = await queue.getJobs([state], parseInt(start), parseInt(end));

    res.json({
      queueName,
      state,
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
      }))
    });
  } catch (error) {
    logger.error(`Queue jobs error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get queue jobs' });
  }
});

/**
 * GET /api/queues/:queueName/stats
 * Get statistics for a specific queue
 */
router.get('/:queueName/stats', async (req, res) => {
  try {
    const { queueName } = req.params;
    const { period = '24h' } = req.query;
    
    const queueService = JobQueueService.getInstance();
    const queue = queueService.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const counts = await queue.getJobCounts();
    
    // Get completed jobs for statistics
    const completedJobs = await queue.getJobs(['completed'], 0, 100);
    const failedJobs = await queue.getJobs(['failed'], 0, 100);

    // Calculate average processing time
    const processingTimes = completedJobs
      .filter(job => job.finishedOn && job.processedOn)
      .map(job => job.finishedOn - job.processedOn);
    
    const avgProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0;

    // Calculate success rate
    const totalProcessed = completedJobs.length + failedJobs.length;
    const successRate = totalProcessed > 0 
      ? ((completedJobs.length / totalProcessed) * 100).toFixed(2)
      : 100;

    res.json({
      queueName,
      period,
      counts,
      statistics: {
        totalProcessed,
        successRate: parseFloat(successRate),
        avgProcessingTime,
        avgProcessingTimeMinutes: (avgProcessingTime / 60000).toFixed(2)
      },
      recentFailures: failedJobs.slice(0, 5).map(job => ({
        id: job.id,
        name: job.name,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn
      }))
    });
  } catch (error) {
    logger.error(`Queue stats error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

/**
 * DELETE /api/queues/:queueName/jobs/:jobId
 * Remove a job from the queue
 */
router.delete('/:queueName/jobs/:jobId', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    
    const queueService = JobQueueService.getInstance();
    const queue = queueService.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.remove();

    // Log the job removal
    await AuditLogService.log({
      entityType: 'QueueJob',
      entityId: jobId,
      action: 'remove',
      userId: req.user?.id,
      actorType: 'admin',
      metadata: { queueName },
      status: 'success'
    });

    res.json({ success: true, message: 'Job removed from queue' });
  } catch (error) {
    logger.error(`Job removal error: ${error.message}`);
    res.status(500).json({ error: 'Failed to remove job' });
  }
});

/**
 * POST /api/queues/:queueName/jobs/:jobId/retry
 * Retry a failed job
 */
router.post('/:queueName/jobs/:jobId/retry', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    
    const queueService = JobQueueService.getInstance();
    const queue = queueService.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.retry();

    // Log the job retry
    await AuditLogService.log({
      entityType: 'QueueJob',
      entityId: jobId,
      action: 'retry',
      userId: req.user?.id,
      actorType: 'admin',
      metadata: { queueName },
      status: 'success'
    });

    res.json({ success: true, message: 'Job queued for retry' });
  } catch (error) {
    logger.error(`Job retry error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

/**
 * POST /api/queues/:queueName/pause
 * Pause a queue
 */
router.post('/:queueName/pause', async (req, res) => {
  try {
    const { queueName } = req.params;
    
    const queueService = JobQueueService.getInstance();
    const queue = queueService.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    await queue.pause();

    // Log the queue pause
    await AuditLogService.log({
      entityType: 'Queue',
      entityId: queueName,
      action: 'pause',
      userId: req.user?.id,
      actorType: 'admin',
      status: 'success'
    });

    res.json({ success: true, message: 'Queue paused' });
  } catch (error) {
    logger.error(`Queue pause error: ${error.message}`);
    res.status(500).json({ error: 'Failed to pause queue' });
  }
});

/**
 * POST /api/queues/:queueName/resume
 * Resume a paused queue
 */
router.post('/:queueName/resume', async (req, res) => {
  try {
    const { queueName } = req.params;
    
    const queueService = JobQueueService.getInstance();
    const queue = queueService.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    await queue.resume();

    // Log the queue resume
    await AuditLogService.log({
      entityType: 'Queue',
      entityId: queueName,
      action: 'resume',
      userId: req.user?.id,
      actorType: 'admin',
      status: 'success'
    });

    res.json({ success: true, message: 'Queue resumed' });
  } catch (error) {
    logger.error(`Queue resume error: ${error.message}`);
    res.status(500).json({ error: 'Failed to resume queue' });
  }
});

/**
 * GET /api/audit/queue-logs
 * Get audit logs for queue operations
 */
router.get('/audit/queue-logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0, queueName } = req.query;
    
    const where = { entityType: 'Queue' };
    if (queueName) {
      where.entityId = queueName;
    }

    const logs = await AuditLogService.getEntityLogs('Queue', queueName || null, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ logs });
  } catch (error) {
    logger.error(`Audit logs error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

/**
 * GET /api/audit/job-logs
 * Get audit logs for job operations
 */
router.get('/audit/job-logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0, queueName } = req.query;
    
    const where = { entityType: 'QueueJob' };
    
    const logs = await AuditLogService.getLogsByAction('queue', {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ logs });
  } catch (error) {
    logger.error(`Job audit logs error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get job audit logs' });
  }
});

/**
 * GET /api/queues/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const queueService = JobQueueService.getInstance();
    
    const dashboard = {
      overview: {
        totalQueues: Object.keys(queueService.queues || {}).length,
        totalWorkers: Object.keys(queueService.workers || {}).length,
        systemStatus: queueService.initialized ? 'healthy' : 'unhealthy'
      },
      queues: {},
      workers: {},
      recentActivity: [],
      timestamp: new Date().toISOString()
    };

    // Get data for each queue
    for (const [queueName, queue] of Object.entries(queueService.queues || {})) {
      if (queue) {
        const counts = await queue.getJobCounts();
        dashboard.queues[queueName] = {
          counts,
          health: counts.failed > 10 ? 'warning' : 'healthy'
        };
      }
    }

    // Get worker status
    for (const [workerName, worker] of Object.entries(queueService.workers || {})) {
      if (worker) {
        dashboard.workers[workerName] = {
          running: !worker.isClosing()
        };
      }
    }

    // Get recent audit logs
    const recentLogs = await AuditLogService.getLogsByAction('queue', { limit: 10 });
    dashboard.recentActivity = recentLogs;

    res.json(dashboard);
  } catch (error) {
    logger.error(`Dashboard error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

export default router;
