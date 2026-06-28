import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const AgentActivity = sequelize.define('AgentActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'AutonomousAgent',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  activityType: {
    type: DataTypes.ENUM('search', 'application', 'match', 'notification', 'error'),
    defaultValue: 'search'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Job',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['activity_type'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

export default AgentActivity;
