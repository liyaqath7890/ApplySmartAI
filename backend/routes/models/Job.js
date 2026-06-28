import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recruiterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  requirements: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  responsibilities: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  employmentType: {
    type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
    defaultValue: 'full-time'
  },
  experienceLevel: {
    type: DataTypes.ENUM('entry', 'mid', 'senior', 'lead', 'executive'),
    allowNull: false
  },
  salaryMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  salaryMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  salaryCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  salaryPeriod: {
    type: DataTypes.ENUM('hourly', 'monthly', 'yearly'),
    defaultValue: 'yearly'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isRemote: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHybrid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isOnsite: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'closed', 'expired'),
    defaultValue: 'draft'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  applicationsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  }
}, {
  underscored: true,
  indexes: [
    {
      fields: ['recruiter_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['experience_level']
    },
    {
      fields: ['employment_type']
    },
    {
      fields: ['is_remote']
    },
    {
      fields: ['location']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default Job;