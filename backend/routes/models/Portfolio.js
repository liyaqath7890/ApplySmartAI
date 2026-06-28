import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Portfolio = sequelize.define('Portfolio', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  theme: {
    type: DataTypes.ENUM('modern', 'classic', 'minimal', 'dark', 'colorful'),
    defaultValue: 'modern'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  config: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['slug'], unique: true },
    { fields: ['is_public'] }
  ]
});

export default Portfolio;
