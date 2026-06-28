import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const AutonomousAgent = sequelize.define('AutonomousAgent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  agentType: {
    type: DataTypes.ENUM('job_search', 'application', 'both'),
    defaultValue: 'both'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  config: {
    type: DataTypes.JSONB,
    defaultValue: {
      jobPreferences: {},
      applicationSettings: {
        autoApply: false,
        dailyLimit: 5,
        requireApproval: true
      }
    }
  },
  status: {
    type: DataTypes.ENUM('inactive', 'active', 'paused', 'error'),
    defaultValue: 'inactive'
  },
  lastRunAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextRunAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  applicationsToday: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['status'] },
    { fields: ['agent_type'] }
  ]
});

export default AutonomousAgent;
