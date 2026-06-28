import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Job',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  externalJobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ExternalJob',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resumeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Resume',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  coverLetterId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'CoverLetter',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'viewed', 'shortlisted', 'rejected', 'interviewing', 'offered', 'accepted', 'withdrawn'),
    defaultValue: 'pending'
  },
  matchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100,
    comment: 'AI-generated match score'
  },
  aiAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  recruiterNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    min: 1,
    max: 5,
    allowNull: true
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isAiScreened: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  screeningScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  mode: {
    type: DataTypes.ENUM('manual', 'semi-automatic', 'fully-automatic'),
    defaultValue: 'manual'
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    {
      fields: ['job_id']
    },
    {
      fields: ['candidate_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['match_score']
    },
    {
      fields: ['applied_at']
    }
  ]
});

export default Application;