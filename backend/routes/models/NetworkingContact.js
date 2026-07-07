import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const NetworkingContact = sequelize.define('NetworkingContact', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedinUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  githubUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  portfolioUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitterUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  websiteUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'connection_request_sent',
      'connected',
      'referral_requested',
      'referral_received',
      'cold_outreach_sent',
      'replied',
      'other'
    ),
    defaultValue: 'connection_request_sent'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  goals: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  interactionHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  lastContactAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['follow_up_date'] }
  ]
});

export default NetworkingContact;
