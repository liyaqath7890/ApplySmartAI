import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const ResumeVersionV2 = sequelize.define('ResumeVersionV2', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'User', key: 'id' },
    onDelete: 'CASCADE'
  },
  targetRole: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  atsKeywords: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  atsScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Job', key: 'id' },
    onDelete: 'SET NULL'
  },
  externalJobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'ExternalJob', key: 'id' },
    onDelete: 'SET NULL'
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['target_role'] },
    { fields: ['is_primary'] }
  ]
});

export default ResumeVersionV2;
