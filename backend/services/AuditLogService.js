import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Audit Log Model
 */
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    index: true
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
    index: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    index: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    index: true
  },
  actorType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  actorId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  changes: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  previousState: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  newState: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('success', 'failure', 'pending'),
    defaultValue: 'success'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    index: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['user_id'] },
    { fields: ['action'] },
    { fields: ['timestamp'] },
    { fields: ['status'] }
  ]
});

class AuditLogService {
  /**
   * Log an audit event
   */
  async log(params) {
    try {
      const {
        entityType,
        entityId,
        action,
        userId,
        actorType,
        actorId,
        changes,
        previousState,
        newState,
        metadata,
        ipAddress,
        userAgent,
        status = 'success',
        errorMessage,
        duration
      } = params;

      const logEntry = await AuditLog.create({
        entityType,
        entityId,
        action,
        userId,
        actorType,
        actorId,
        changes,
        previousState,
        newState,
        metadata,
        ipAddress,
        userAgent,
        status,
        errorMessage,
        duration,
        timestamp: new Date()
      });

      logger.info(`Audit log created: ${action} on ${entityType}:${entityId}`);
      return logEntry;
    } catch (error) {
      logger.error(`Audit log creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log AI agent execution
   */
  async logAgentExecution(params) {
    const {
      agentType,
      agentId,
      action,
      userId,
      inputData,
      outputData,
      status,
      errorMessage,
      duration
    } = params;

    return await this.log({
      entityType: 'Agent',
      entityId: agentId,
      action: `agent.${agentType}.${action}`,
      userId,
      actorType: 'system',
      changes: inputData,
      newState: outputData,
      metadata: { agentType },
      status,
      errorMessage,
      duration
    });
  }

  /**
   * Log queue job execution
   */
  async logQueueJob(params) {
    const {
      queueName,
      jobId,
      jobType,
      userId,
      inputData,
      outputData,
      status,
      errorMessage,
      duration
    } = params;

    return await this.log({
      entityType: 'QueueJob',
      entityId: jobId,
      action: `queue.${queueName}.${jobType}`,
      userId,
      actorType: 'worker',
      changes: inputData,
      newState: outputData,
      metadata: { queueName, jobType },
      status,
      errorMessage,
      duration
    });
  }

  /**
   * Log workflow execution
   */
  async logWorkflowExecution(params) {
    const {
      workflowType,
      workflowId,
      step,
      userId,
      inputData,
      outputData,
      status,
      errorMessage,
      duration
    } = params;

    return await this.log({
      entityType: 'Workflow',
      entityId: workflowId,
      action: `workflow.${workflowType}.${step}`,
      userId,
      actorType: 'orchestrator',
      changes: inputData,
      newState: outputData,
      metadata: { workflowType, step },
      status,
      errorMessage,
      duration
    });
  }

  /**
   * Log API request
   */
  async logAPIRequest(params) {
    const {
      endpoint,
      method,
      userId,
      requestBody,
      responseBody,
      statusCode,
      ipAddress,
      userAgent,
      duration
    } = params;

    return await this.log({
      entityType: 'APIRequest',
      entityId: null,
      action: `api.${method}.${endpoint}`,
      userId,
      actorType: 'user',
      changes: requestBody,
      newState: responseBody,
      metadata: { endpoint, method, statusCode },
      ipAddress,
      userAgent,
      status: statusCode >= 400 ? 'failure' : 'success',
      duration
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(params) {
    const {
      entityType,
      entityId,
      action,
      userId,
      accessedFields,
      ipAddress,
      userAgent
    } = params;

    return await this.log({
      entityType,
      entityId,
      action: `data.${action}`,
      userId,
      actorType: 'user',
      metadata: { accessedFields },
      ipAddress,
      userAgent,
      status: 'success'
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(params) {
    const {
      eventType,
      userId,
      ipAddress,
      userAgent,
      details,
      severity = 'medium'
    } = params;

    return await this.log({
      entityType: 'SecurityEvent',
      entityId: null,
      action: `security.${eventType}`,
      userId,
      actorType: 'system',
      metadata: { severity, ...details },
      ipAddress,
      userAgent,
      status: severity === 'critical' ? 'failure' : 'success'
    });
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityLogs(entityType, entityId, options = {}) {
    const { limit = 100, offset = 0, orderBy = 'timestamp', order = 'DESC' } = options;

    try {
      const logs = await AuditLog.findAll({
        where: { entityType, entityId },
        order: [[orderBy, order]],
        limit,
        offset
      });

      return logs;
    } catch (error) {
      logger.error(`Error fetching entity logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId, options = {}) {
    const { limit = 100, offset = 0, orderBy = 'timestamp', order = 'DESC' } = options;

    try {
      const logs = await AuditLog.findAll({
        where: { userId },
        order: [[orderBy, order]],
        limit,
        offset
      });

      return logs;
    } catch (error) {
      logger.error(`Error fetching user logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get logs by action type
   */
  async getLogsByAction(action, options = {}) {
    const { limit = 100, offset = 0, startDate, endDate } = options;

    try {
      const where = { action };
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[Op.gte] = startDate;
        if (endDate) where.timestamp[Op.lte] = endDate;
      }

      const logs = await AuditLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit,
        offset
      });

      return logs;
    } catch (error) {
      logger.error(`Error fetching logs by action: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(options = {}) {
    const { startDate, endDate, entityType } = options;

    try {
      const where = {};
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[Op.gte] = startDate;
        if (endDate) where.timestamp[Op.lte] = endDate;
      }

      if (entityType) {
        where.entityType = entityType;
      }

      const total = await AuditLog.count({ where });
      const success = await AuditLog.count({ where: { ...where, status: 'success' } });
      const failure = await AuditLog.count({ where: { ...where, status: 'failure' } });
      const pending = await AuditLog.count({ where: { ...where, status: 'pending' } });

      const actionCounts = await AuditLog.findAll({
        attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where,
        group: ['action'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
      });

      return {
        total,
        success,
        failure,
        pending,
        successRate: total > 0 ? ((success / total) * 100).toFixed(2) : 0,
        topActions: actionCounts.map(a => ({ action: a.action, count: parseInt(a.dataValues.count) }))
      };
    } catch (error) {
      logger.error(`Error fetching audit statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get audit trail for a workflow
   */
  async getWorkflowTrail(workflowId) {
    try {
      const logs = await AuditLog.findAll({
        where: {
          entityType: 'Workflow',
          entityId: workflowId
        },
        order: [['timestamp', 'ASC']]
      });

      return logs;
    } catch (error) {
      logger.error(`Error fetching workflow trail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanup(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await AuditLog.destroy({
        where: {
          timestamp: {
            [Op.lt]: cutoffDate
          }
        }
      });

      logger.info(`Cleaned up ${deletedCount} old audit logs`);
      return deletedCount;
    } catch (error) {
      logger.error(`Audit log cleanup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportLogs(options = {}) {
    const { startDate, endDate, entityType, action, format = 'json' } = options;

    try {
      const where = {};
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[Op.gte] = startDate;
        if (endDate) where.timestamp[Op.lte] = endDate;
      }

      if (entityType) where.entityType = entityType;
      if (action) where.action = action;

      const logs = await AuditLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: 10000
      });

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else if (format === 'csv') {
        const headers = ['id', 'entityType', 'entityId', 'action', 'userId', 'status', 'timestamp'];
        const rows = logs.map(log => 
          headers.map(h => log[h] || '').join(',')
        );
        return [headers.join(','), ...rows].join('\n');
      }

      return logs;
    } catch (error) {
      logger.error(`Audit log export failed: ${error.message}`);
      throw error;
    }
  }
}

export default new AuditLogService();
export { AuditLog };
