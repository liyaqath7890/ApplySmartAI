import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'application_id',
    references: {
      model: 'Application',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'job_id',
    references: {
      model: 'Job',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  recruiterId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'recruiter_id',
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('screening', 'technical', 'behavioral', 'final', 'hr'),
    defaultValue: 'screening'
  },
  format: {
    type: DataTypes.ENUM('phone', 'video', 'in-person', 'ai-mock'),
    defaultValue: 'video'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Duration in minutes'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'),
    defaultValue: 'scheduled'
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meetingId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meetingPassword: {
    type: DataTypes.STRING,
    allowNull: true
  },
  questions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  rating: {
    type: DataTypes.INTEGER,
    min: 1,
    max: 5,
    allowNull: true
  },
  aiEvaluation: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  recordingUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    {
      fields: ['application_id']
    },
    {
      fields: ['job_id']
    },
    {
      fields: ['candidate_id']
    },
    {
      fields: ['recruiter_id']
    },
    {
      fields: ['scheduled_at']
    },
    {
      fields: ['status']
    }
  ]
});

export default Interview;