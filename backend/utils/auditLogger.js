import logger from './logger.js';

class AuditLogger {
  /**
   * Log a security or system operation event.
   * @param {string} action - Action name (e.g., 'COMPANY_FOLLOW', 'SYNC_START')
   * @param {Object} actor - User / Entity performing the action
   * @param {Object} details - Additional metadata parameters
   */
  log(action, actor, details = {}) {
    const actorId = actor?.id || 'system';
    const actorEmail = actor?.email || 'system@applysmart.ai';

    const logPayload = {
      timestamp: new Date().toISOString(),
      action,
      actor: { id: actorId, email: actorEmail },
      details
    };

    logger.info(`[AUDIT] ${action} by ${actorEmail} - ${JSON.stringify(details)}`);
    
    // In production, this can also write to an 'AuditLogs' database table if needed
  }
}

export default new AuditLogger();
