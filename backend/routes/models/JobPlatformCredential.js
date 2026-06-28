import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const JobPlatformCredential = sequelize.define('JobPlatformCredential', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'candidate_id',
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  platform: {
    type: DataTypes.ENUM('linkedin', 'naukri', 'foundit', 'wellfound', 'instahyre', 'indeed', 'cutshort', 'hirist'),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  encryptedPassword: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  apiKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncStatus: {
    type: DataTypes.ENUM('idle', 'syncing', 'success', 'error'),
    defaultValue: 'idle'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      autoApply: false,
      requireApproval: true,
      dailyLimit: 5,
      searchFilters: {}
    }
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['platform'] },
    { fields: ['is_active'] },
    { unique: true, fields: ['candidate_id', 'platform'] }
  ]
});

export default JobPlatformCredential;
