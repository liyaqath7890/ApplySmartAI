import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  careerPageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  atsPlatform: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  externalCompanyId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  companySize: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  headquarters: {
    type: DataTypes.STRING,
    allowNull: true
  },
  foundedYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  officeLocations: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  hiringLocations: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  remoteAvailability: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  hybridAvailability: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  onsiteAvailability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  internshipAvailability: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fresherFriendly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  experiencedHiring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  companyRating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  technologiesUsed: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  benefits: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending'
  },
  activeStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  hiringStatus: {
    type: DataTypes.ENUM('Actively Hiring', 'Hiring Freeze', 'Unknown'),
    defaultValue: 'Unknown'
  },
  
  // Sync Management
  lastSyncTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastSuccessfulSync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncFrequency: {
    type: DataTypes.STRING(50),
    defaultValue: 'daily'
  },
  failedSyncCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  schedulerStatus: {
    type: DataTypes.ENUM('idle', 'queued', 'syncing', 'failed'),
    defaultValue: 'idle'
  },
  syncLogs: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  // Analytics
  jobCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  activeJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expiredJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['ats_platform'] },
    { fields: ['external_company_id'] },
    { fields: ['industry'] },
    { fields: ['category'] },
    { fields: ['verification_status'] },
    { fields: ['active_status'] },
    { fields: ['hiring_status'] }
  ]
});

export default Company;
