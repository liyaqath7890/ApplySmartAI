/**
 * Notification Worker Processors
 *
 * BullMQ processor functions for the `notifications` and `email-digests` queues.
 * These are registered in the main server startup via JobQueueService.createWorkers().
 *
 * Job types handled:
 *  • send-notification       — generic in-app + email notification
 *  • send-job-alert          — job match alert to a specific user
 *  • send-daily-digest-batch — batch daily digest to all opted-in users
 *  • send-weekly-summary-batch — batch weekly summary
 *  • send-application-update — application status change notification
 */

import NotificationService from '../services/NotificationService.js';
import logger from '../utils/logger.js';
import { User, Notification, Application, ExternalJob } from '../routes/models/index.js';
import { Op } from 'sequelize';

/**
 * Generic notification processor.
 * Handles real-time Socket.IO and optionally email.
 */
export async function notificationProcessor(job) {
  const { userId, type, data } = job.data;

  try {
    logger.info(`[NotifWorker] Processing ${type} for user ${userId}`);

    // 1. Persist to DB
    const notification = await Notification.create({
      userId,
      type,
      title: data.title || type,
      message: data.message || '',
      isRead: false,
      data: data.payload || {},
      actionUrl: data.actionUrl || null,
    });

    // 2. Real-time push via Socket.IO
    NotificationService.sendRealtimeNotification(userId, 'notification', {
      id: notification.id,
      type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });

    // 3. Email if requested
    if (data.sendEmail && data.email) {
      await NotificationService.sendEmail({
        to:      data.email,
        subject: data.title || type,
        html:    `<p>${data.message || ''}</p>`,
        text:    data.message || '',
      });
    }

    return { notificationId: notification.id };
  } catch (err) {
    logger.error(`[NotifWorker] ${type} failed for user ${userId}: ${err.message}`);
    throw err;
  }
}

/**
 * Job alert processor.
 * Sends a batch of matched jobs to the user via email + Socket.IO.
 */
export async function jobAlertProcessor(job) {
  const { userId, userEmail, jobs, searchCriteria } = job.data;

  try {
    logger.info(`[NotifWorker] Sending job alert to ${userEmail}: ${jobs?.length || 0} jobs`);
    await NotificationService.sendJobAlert(userId, userEmail, jobs || [], searchCriteria || {});
    return { sent: true, jobCount: jobs?.length || 0 };
  } catch (err) {
    logger.error(`[NotifWorker] Job alert failed: ${err.message}`);
    throw err;
  }
}

/**
 * Application status update processor.
 */
export async function applicationUpdateProcessor(job) {
  const { userId, userEmail, applicationId, status } = job.data;

  try {
    const application = await Application.findByPk(applicationId, {
      include: [
        { model: ExternalJob, as: 'externalJob' },
      ],
    });

    if (!application) {
      logger.warn(`[NotifWorker] Application ${applicationId} not found`);
      return;
    }

    await NotificationService.sendApplicationUpdate(userId, userEmail, application, status);
    return { sent: true };
  } catch (err) {
    logger.error(`[NotifWorker] Application update failed: ${err.message}`);
    throw err;
  }
}

/**
 * Daily digest batch processor.
 * Fetches all users with daily_digest preference and sends emails.
 */
export async function dailyDigestBatchProcessor(job) {
  logger.info('[NotifWorker] Starting daily digest batch');

  try {
    // Get all active users (opt-in assumed; extend with user preferences table as needed)
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'email', 'firstName', 'lastName'],
      limit: 500, // Process in chunks to avoid memory pressure
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const digestData = await buildDigestData(user.id);
        if (hasDigestContent(digestData)) {
          await NotificationService.sendDailyDigest(user.id, user.email, digestData);
          sent++;
        }
      } catch (userErr) {
        logger.warn(`[NotifWorker] Daily digest failed for ${user.email}: ${userErr.message}`);
        failed++;
      }
    }

    logger.info(`[NotifWorker] Daily digest batch complete — sent: ${sent}, failed: ${failed}`);
    return { sent, failed, total: users.length };
  } catch (err) {
    logger.error(`[NotifWorker] Daily digest batch failed: ${err.message}`);
    throw err;
  }
}

/**
 * Weekly summary batch processor.
 */
export async function weeklySummaryBatchProcessor(job) {
  logger.info('[NotifWorker] Starting weekly summary batch');

  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'email', 'firstName', 'lastName'],
      limit: 500,
    });

    let sent = 0;

    for (const user of users) {
      try {
        const summaryData = await buildWeeklySummaryData(user.id);
        await NotificationService.sendWeeklySummary(user.id, user.email, summaryData);
        sent++;
      } catch (userErr) {
        logger.warn(`[NotifWorker] Weekly summary failed for ${user.email}: ${userErr.message}`);
      }
    }

    logger.info(`[NotifWorker] Weekly summary batch complete — sent: ${sent}`);
    return { sent, total: users.length };
  } catch (err) {
    logger.error(`[NotifWorker] Weekly summary batch failed: ${err.message}`);
    throw err;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function buildDigestData(userId) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [newJobs, applications, interviews] = await Promise.allSettled([
    ExternalJob.findAll({
      where: { candidateId: userId, createdAt: { [Op.gte]: oneDayAgo } },
      order: [['matchScore', 'DESC']],
      limit: 10,
    }),
    Application.findAll({
      where: { candidateId: userId, updatedAt: { [Op.gte]: oneDayAgo } },
      limit: 5,
    }),
    // Placeholder — extend when Interview model has scheduledAt
    Promise.resolve([]),
  ]);

  return {
    newJobs:      newJobs.status === 'fulfilled' ? newJobs.value : [],
    applications: applications.status === 'fulfilled' ? applications.value : [],
    interviews:   interviews.status === 'fulfilled' ? interviews.value : [],
    matches:      [],
  };
}

async function buildWeeklySummaryData(userId) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const applicationCount = await Application.count({
    where: { candidateId: userId, createdAt: { [Op.gte]: oneWeekAgo } },
  });

  return {
    jobApplications: applicationCount,
    interviews:       0,
    newConnections:   0,
    profileViews:     0,
    searchActivity:   { totalSearches: 0, topKeywords: [] },
  };
}

function hasDigestContent(data) {
  return data.newJobs.length > 0 || data.applications.length > 0 || data.interviews.length > 0;
}

export const notificationProcessors = {
  notifications:   notificationProcessor,
  jobAlert:        jobAlertProcessor,
  applicationUpdate: applicationUpdateProcessor,
  emailDigests:    dailyDigestBatchProcessor,
  weeklySummary:   weeklySummaryBatchProcessor,
};

export default notificationProcessors;
