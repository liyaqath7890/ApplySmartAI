import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const ApplicationPackage = sequelize.define('ApplicationPackage', {
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
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'job_id',
    references: {
      model: 'Job',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  externalJobId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'external_job_id',
    references: {
      model: 'ExternalJob',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  resumeId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'resume_id',
    references: {
      model: 'Resume',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  coverLetterId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cover_letter_id',
    references: {
      model: 'CoverLetter',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  status: {
    type: DataTypes.ENUM('draft', 'ready_for_review', 'approved', 'rejected', 'submitted'),
    defaultValue: 'draft'
  },
  matchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  aiRecommendations: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewed_by'
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['status'] },
    { fields: ['job_id'] },
    { fields: ['external_job_id'] },
    { fields: ['created_at'] }
  ]
});

export default ApplicationPackage;
