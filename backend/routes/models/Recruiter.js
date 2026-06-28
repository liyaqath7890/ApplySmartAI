import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Recruiter = sequelize.define('Recruiter', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedinUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('recruiter', 'hiring_manager', 'founder', 'talent_acquisition'),
    defaultValue: 'recruiter'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'engaged'),
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  lastContactAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['company'] },
    { fields: ['type'] },
    { fields: ['status'] }
  ]
});

export default Recruiter;
