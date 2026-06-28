import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const AgentTask = sequelize.define('AgentTask', {
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
  taskType: {
    type: DataTypes.ENUM('search_jobs', 'apply', 'generate_cover_letter', 'generate_resume', 'analyze_job'),
    defaultValue: 'search_jobs'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  inputData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  resultData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['task_type'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['created_at'] }
  ]
});

export default AgentTask;
