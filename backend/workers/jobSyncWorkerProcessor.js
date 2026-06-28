/**
 * Job Sync Worker Processor
 *
 * Handles BullMQ jobs in the `job-aggregation` queue for:
 *   • scheduled-sync  — system-wide periodic sync from providers
 *   • aggregate-jobs  — candidate-specific job fetch (existing)
 *   • cleanup-expired-jobs — marks stale ExternalJob records as expired
 *
 * Registered in server startup via JobQueueService.createWorkers().
 */

import jobAggregationService from '../services/jobAggregation/JobAggregationService.js';
import logger from '../utils/logger.js';
import { ExternalJob } from '../routes/models/index.js';
import { Op } from 'sequelize';

/**
 * Main job aggregation processor.
 * Routes job types to appropriate handlers.
 */
export async function jobAggregationProcessor(job) {
  const { name, data } = job;

  logger.info(`[JobSyncWorker] Processing job: ${name}`);

  switch (name) {
    case 'scheduled-sync':
      return await handleScheduledSync(data);

    case 'aggregate-jobs':
      return await handleCandidateAggregation(data);

    case 'cleanup-expired-jobs':
      return await handleExpiredJobCleanup();

    default:
      // Legacy: any unnamed aggregation job (candidateId present)
      if (data?.candidateId) {
        return await handleCandidateAggregation(data);
      }
      logger.warn(`[JobSyncWorker] Unknown job type: ${name}`);
      return null;
  }
}

/**
 * System-wide scheduled sync.
 * No candidateId — fetches jobs for storage without associating to a user.
 */
async function handleScheduledSync({ providers, label }) {
  const start = Date.now();
  logger.info(`[JobSyncWorker] System sync started — providers: ${providers?.join(',') || 'all'}`);

  try {
    // Use a sentinel candidateId for system-level jobs
    // ExternalJob.candidateId is nullable (allowNull: true) so we pass null
    const results = await jobAggregationService.aggregateJobs(
      null, // system-wide, no specific candidate
      { providers, systemWide: true }
    );

    const duration = Date.now() - start;
    logger.info(`[JobSyncWorker] System sync (${label}) done — ${results.length} jobs in ${duration}ms`);

    return { label, count: results.length, duration };
  } catch (err) {
    logger.error(`[JobSyncWorker] System sync failed (${label}): ${err.message}`);
    throw err;
  }
}

/**
 * Candidate-specific job aggregation (triggered by user action or queue).
 */
async function handleCandidateAggregation({ candidateId, searchParams }) {
  const start = Date.now();
  logger.info(`[JobSyncWorker] Candidate aggregation: ${candidateId}`);

  try {
    const results = await jobAggregationService.aggregateJobs(candidateId, searchParams || {});
    const duration = Date.now() - start;
    logger.info(`[JobSyncWorker] Candidate ${candidateId} — ${results.length} jobs in ${duration}ms`);
    return { candidateId, count: results.length, duration };
  } catch (err) {
    logger.error(`[JobSyncWorker] Candidate aggregation failed for ${candidateId}: ${err.message}`);
    throw err;
  }
}

/**
 * Mark ExternalJob records older than 30 days or with expiredDate in the past as expired.
 */
async function handleExpiredJobCleanup() {
  logger.info('[JobSyncWorker] Running expired job cleanup');

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  try {
    const [updatedCount] = await ExternalJob.update(
      { isExpired: true, freshnessScore: 0 },
      {
        where: {
          isExpired: false,
          [Op.or]: [
            { postedDate: { [Op.lt]: cutoff } },
            { expiredDate: { [Op.lt]: new Date() } },
          ],
        },
      }
    );

    logger.info(`[JobSyncWorker] Marked ${updatedCount} jobs as expired`);
    return { expiredCount: updatedCount };
  } catch (err) {
    logger.error(`[JobSyncWorker] Cleanup failed: ${err.message}`);
    throw err;
  }
}

export default jobAggregationProcessor;
