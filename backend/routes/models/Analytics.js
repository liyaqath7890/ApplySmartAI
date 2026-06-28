import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  analyticsType: {
    type: DataTypes.ENUM('salary_prediction', 'market_demand', 'skill_trends', 'career_success'),
    defaultValue: 'skill_trends'
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  filters: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['analytics_type'] },
    { fields: ['generated_at'] }
  ]
});

export default Analytics;
