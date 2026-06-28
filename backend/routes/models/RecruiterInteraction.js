import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const RecruiterInteraction = sequelize.define('RecruiterInteraction', {
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
  recruiterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Recruiter',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('email', 'linkedin_message', 'call', 'in_person', 'other'),
    defaultValue: 'email'
  },
  direction: {
    type: DataTypes.ENUM('outbound', 'inbound'),
    defaultValue: 'outbound'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'delivered', 'opened', 'replied', 'failed'),
    defaultValue: 'draft'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  openedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  repliedAt: {
    type: DataTypes.DATE,
    allowNull: true
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
  externalJobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ExternalJob',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['recruiter_id'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['sent_at'] }
  ]
});

export default RecruiterInteraction;
