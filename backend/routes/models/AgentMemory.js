import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const AgentMemory = sequelize.define('AgentMemory', {
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
  type: {
    type: DataTypes.ENUM('conversation', 'application', 'interview', 'recruiter_interaction', 'preference', 'other'),
    allowNull: false
  },
  content: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  embedding: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  relevanceScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['type'] },
    { fields: ['relevance_score'] }
  ]
});

export default AgentMemory;
