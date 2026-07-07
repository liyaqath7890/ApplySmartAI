import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const CoachReport = sequelize.define('CoachReport', {
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
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    defaultValue: 'daily'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  content: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  checklist: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['type'] },
    { fields: ['date'] }
  ]
});

export default CoachReport;
