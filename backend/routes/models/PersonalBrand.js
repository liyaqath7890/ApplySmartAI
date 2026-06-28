import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const PersonalBrand = sequelize.define('PersonalBrand', {
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
  brandType: {
    type: DataTypes.ENUM('linkedin_summary', 'linkedin_headline', 'blog_post', 'social_media', 'elevator_pitch', 'bio'),
    defaultValue: 'linkedin_summary'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['brand_type'] },
    { fields: ['is_published'] }
  ]
});

export default PersonalBrand;
