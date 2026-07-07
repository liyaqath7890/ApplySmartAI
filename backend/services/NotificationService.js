import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Notification Service
 * Handles email, push, and scheduled digest notifications
 */
export class NotificationService {
  constructor() {
    this.transporter = null;
    this.io = null; // Socket.IO instance
    this.emailConfigured = false;
    
    this.initializeEmail();
  }

  /**
   * Initialize email transporter
   */
  initializeEmail() {
    if (config.email?.host && config.email?.user && config.email?.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        }
      });
      this.emailConfigured = true;
      logger.info('Email notifications configured');
    } else {
      logger.warn('Email notifications not configured - missing SMTP settings');
    }
  }

  /**
   * Set Socket.IO instance for real-time notifications
   */
  setSocketIO(io) {
    this.io = io;
    logger.info('Socket.IO notifications configured');
  }

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.emailConfigured) {
      logger.warn('Email not configured, skipping send');
      return { success: false, message: 'Email not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
        text,
        attachments
      });

      logger.info(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Error sending email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send real-time notification via Socket.IO
   */
  sendRealtimeNotification(userId, event, data) {
    if (!this.io) {
      logger.warn('Socket.IO not configured');
      return false;
    }

    try {
      // Send to user's room
      this.io.to(`user-${userId}`).emit(event, {
        timestamp: new Date().toISOString(),
        ...data
      });

      logger.info(`Realtime notification sent to user ${userId}: ${event}`);
      return true;
    } catch (error) {
      logger.error(`Error sending realtime notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Send job alert notification
   */
  async sendJobAlert(userId, userEmail, jobs, searchCriteria) {
    const jobCount = jobs.length;
    const subject = `🔍 ${jobCount} New Jobs Match Your Search: ${searchCriteria.keyword || 'Your Criteria'}`;
    
    const html = this.renderJobAlertTemplate(jobs, searchCriteria);
    const text = this.renderJobAlertTextTemplate(jobs, searchCriteria);

    // Send email
    const emailResult = await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text
    });

    // Send realtime notification
    this.sendRealtimeNotification(userId, 'job-alert', {
      type: 'job_alert',
      jobCount,
      searchCriteria,
      jobs: jobs.slice(0, 5).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        matchScore: j.matchScore
      }))
    });

    return emailResult;
  }

  /**
   * Send company job alert notification (for followed companies)
   */
  async sendCompanyJobAlert(userId, userEmail, company, jobs) {
    const jobCount = jobs.length;
    const subject = `🏢 ${jobCount} New Jobs from ${company.name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${company.name} is Hiring!</h2>
        <p>A company you are following has posted ${jobCount} new jobs.</p>
        
        ${jobs.slice(0, 10).map(job => `
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0;">
            <h3 style="margin: 0 0 5px 0;">${job.title}</h3>
            <p style="margin: 5px 0; color: #666;">
              ${job.location || 'Remote'}
            </p>
            <a href="${job.jobUrl}" 
               style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">
              View Job
            </a>
          </div>
        `).join('')}
        
        <div style="margin-top: 20px; text-align: center;">
          <a href="${config.cors.origin}/app/companies/${company.id}" 
             style="display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">
            View Company Profile
          </a>
        </div>
      </div>
    `;

    const text = `New Jobs from ${company.name}\n\n${jobs.map(j => `${j.title} - ${j.location || 'Remote'}`).join('\n')}`;

    // Send email
    const emailResult = await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text
    });

    // Send realtime notification
    this.sendRealtimeNotification(userId, 'company-job-alert', {
      type: 'company_job_alert',
      companyId: company.id,
      companyName: company.name,
      jobCount,
      jobs: jobs.slice(0, 5).map(j => ({
        id: j.id,
        title: j.title,
        location: j.location
      }))
    });

    return emailResult;
  }

  /**
   * Send application status update
   */
  async sendApplicationUpdate(userId, userEmail, application, status) {
    const subject = `📝 Application Update: ${application.job?.title || 'Your Application'}`;
    
    const statusMessages = {
      submitted: 'Your application has been submitted successfully.',
      reviewed: 'Your application is being reviewed.',
      interview: "Congratulations! You've been invited for an interview.",
      rejected: 'Unfortunately, your application was not selected.',
      withdrawn: 'Your application has been withdrawn.'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Update</h2>
        <p>${statusMessages[status] || 'Your application status has been updated.'}</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${application.job?.title || 'Position'}</h3>
          <p><strong>Company:</strong> ${application.job?.company || 'N/A'}</p>
          <p><strong>Status:</strong> ${status}</p>
          ${application.job?.location ? `<p><strong>Location:</strong> ${application.job.location}</p>` : ''}
        </div>
        <a href="${config.cors.origin}/applications/${application.id}" 
           style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">
          View Application
        </a>
      </div>
    `;

    const emailResult = await this.sendEmail({ to: userEmail, subject, html });

    this.sendRealtimeNotification(userId, 'application-update', {
      type: 'application_update',
      applicationId: application.id,
      status,
      jobId: application.jobId
    });

    return emailResult;
  }

  /**
   * Send daily digest email
   */
  async sendDailyDigest(userId, userEmail, data) {
    const { newJobs, applications, interviews, matches } = data;
    const subject = `📊 Your Daily Job Search Digest - ${new Date().toLocaleDateString()}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Daily Digest</h2>
        
        ${newJobs.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>🔍 New Job Matches (${newJobs.length})</h3>
            ${newJobs.slice(0, 5).map(job => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <strong>${job.title}</strong> at ${job.company}<br>
                <small>${job.location} • Match: ${job.matchScore}%</small>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${applications.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>📝 Application Updates (${applications.length})</h3>
            ${applications.slice(0, 3).map(app => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <strong>${app.job?.title}</strong> - Status: ${app.status}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${interviews.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>🎯 Upcoming Interviews (${interviews.length})</h3>
            ${interviews.slice(0, 3).map(interview => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <strong>${interview.job?.title}</strong> - ${new Date(interview.scheduledAt).toLocaleString()}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${config.cors.origin}/dashboard" 
             style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(userId, userEmail, summary) {
    const { jobApplications, interviews, newConnections, profileViews, searchActivity } = summary;
    const subject = `📈 Your Weekly Job Search Summary - Week ${this.getWeekNumber()}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Weekly Summary</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${jobApplications}</div>
            <div>Applications Sent</div>
          </div>
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${interviews}</div>
            <div>Interviews</div>
          </div>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${newConnections}</div>
            <div>New Connections</div>
          </div>
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${profileViews}</div>
            <div>Profile Views</div>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <h3>Search Activity</h3>
          <p>You searched for ${searchActivity.totalSearches} jobs this week.</p>
          <p>Top keywords: ${searchActivity.topKeywords.join(', ')}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${config.cors.origin}/dashboard" 
             style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">
            View Full Report
          </a>
        </div>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  /**
   * Render job alert HTML template
   */
  renderJobAlertTemplate(jobs, searchCriteria) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🔍 New Jobs Match Your Search</h2>
        <p>We found ${jobs.length} new jobs matching your criteria.</p>
        
        ${jobs.slice(0, 10).map(job => `
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0;">
            <h3 style="margin: 0 0 5px 0;">${job.title}</h3>
            <p style="margin: 5px 0; color: #666;">
              <strong>${job.company}</strong> • ${job.location || 'Remote'}
            </p>
            ${job.salary ? `<p style="margin: 5px 0; color: #4caf50;">${job.salary}</p>` : ''}
            ${job.matchScore ? `<p style="margin: 5px 0;">Match Score: ${job.matchScore}%</p>` : ''}
            <a href="${job.jobUrl}" 
               style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">
              View Job
            </a>
          </div>
        `).join('')}
        
        <div style="margin-top: 20px; text-align: center;">
          <a href="${config.cors.origin}/jobs?${new URLSearchParams(searchCriteria).toString()}" 
             style="display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">
            See All ${jobs.length} Jobs
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Render job alert text template
   */
  renderJobAlertTextTemplate(jobs, searchCriteria) {
    let text = `New Jobs Match Your Search\n\nWe found ${jobs.length} new jobs.\n\n`;
    
    jobs.slice(0, 10).forEach(job => {
      text += `${job.title} at ${job.company}\n`;
      text += `${job.location || 'Remote'}\n`;
      if (job.salary) text += `${job.salary}\n`;
      text += `${job.jobUrl}\n\n`;
    });
    
    return text;
  }

  /**
   * Get current week number
   */
  getWeekNumber() {
    const date = new Date();
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  }

  /**
   * Send browser push notification (requires service worker)
   */
  async sendPushNotification(subscription, { title, body, icon, data }) {
    // This would integrate with Web Push API
    // For now, log the notification
    logger.info(`Push notification: ${title} - ${body}`);
    return { success: true };
  }

  /**
   * Check if a job matches a candidate's explicit alerts preferences (Phase 6)
   */
  async shouldNotifyUserForJob(user, job) {
    try {
      const { CandidateProfile, SavedCompany, Skill } = await import('../routes/models/index.js');
      const profile = await CandidateProfile.findOne({ where: { userId: user.id } });
      if (!profile) return false;

      // 1. Company Follow check
      if (job.companyId) {
        const followed = await SavedCompany.findOne({
          where: { candidateProfileId: profile.id, companyId: job.companyId, isFollowing: true }
        });
        if (followed) return true; // Always notify if followed company
      }

      // 2. Skills Match / Score check (70% threshold)
      if (job.matchScore && job.matchScore < 70) {
        return false;
      }

      // 3. Location Preference check
      if (profile.preferredCities?.length > 0 && job.city) {
        const cityMatch = profile.preferredCities.some(c => job.city.toLowerCase().includes(c.toLowerCase()));
        if (!cityMatch && job.workType !== 'remote') return false;
      }

      // 4. Remote Preference check
      if (profile.remoteAvailability && job.workType) {
        const ra = profile.remoteAvailability.toLowerCase();
        const wt = job.workType.toLowerCase();
        if (ra === 'remote' && wt !== 'remote') return false;
      }

      // 5. Internship Preference check
      if (profile.internshipAvailable !== undefined && job.internship !== undefined) {
        if (job.internship && !profile.internshipAvailable) return false;
      }

      // 6. Experience Level check
      if (profile.experienceLevel && job.experienceLevel) {
        const pe = profile.experienceLevel.toLowerCase();
        const je = job.experienceLevel.toLowerCase();
        if (pe === 'entry' && je !== 'entry' && je !== 'junior') return false;
      }

      // 7. Salary Preference check
      if (profile.expectedSalaryMin && job.salaryMin) {
        if (parseFloat(job.salaryMin) < parseFloat(profile.expectedSalaryMin)) return false;
      }

      return true;
    } catch (err) {
      logger.error(`Error in shouldNotifyUserForJob filter: ${err.message}`);
      return false;
    }
  }

  /**
   * Intelligently send notification about a job to a user if filter passes (Phase 6)
   */
  async notifyUserAboutJob(user, job) {
    const shouldNotify = await this.shouldNotifyUserForJob(user, job);
    if (!shouldNotify) return { success: false, reason: 'Filter requirements not met' };

    const title = `🎯 Perfect Match Found: ${job.title}`;
    const message = `We found a new job posting from ${job.company} matching your profile! Match Score: ${job.matchScore}%`;
    const actionUrl = `${config.cors.origin || 'http://localhost:3000'}/app/job-discovery`;

    // 1. Save In-App Notification (Database)
    try {
      const { Notification } = await import('../routes/models/index.js');
      await Notification.create({
        userId: user.id,
        type: 'job_match',
        title,
        message,
        isRead: false,
        data: { job_id: job.id, url: actionUrl }
      });
    } catch (dbErr) {
      logger.error(`Failed to persist notification in DB: ${dbErr.message}`);
    }

    // 2. Real-time broadcast (Socket.IO)
    this.sendRealtimeNotification(user.id, 'notification', {
      title,
      message,
      type: 'job_match',
      data: { url: actionUrl }
    });

    // 3. Email Notification (Nodemailer)
    if (user.email) {
      await this.sendEmail({
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
            <h2 style="color: #2563eb;">🎯 New Match Alert!</h2>
            <p>${message}</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <strong>Position:</strong> ${job.title}<br>
              <strong>Company:</strong> ${job.company}<br>
              <strong>Location:</strong> ${job.location || 'Remote'}<br>
              <strong>Match Score:</strong> ${job.matchScore}%
            </div>
            <a href="${actionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
          </div>
        `
      });
    }

    // 4. Future Channel Extensions (Push, WhatsApp, Telegram Hooks)
    await this.broadcastToAlternateChannels(user, { title, message, url: actionUrl });

    return { success: true };
  }

  /**
   * Broadcaster placeholder for external channels like Push, WhatsApp, Telegram
   */
  async broadcastToAlternateChannels(user, payload) {
    logger.info(`[AlternateChannels] Broadcasting alert for User ${user.id} to SMS/WhatsApp/Telegram (Stubs)`);
    // Push notifications, WhatsApp Business API, Telegram bot triggers go here
  }

  /**
   * Batch send notifications
   */
  async batchSend(notifications) {
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(n => this.sendEmail(n))
      );
      results.push(...batchResults);
    }

    return results;
  }
}

export default new NotificationService();