import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const CareerTwin = sequelize.define('CareerTwin', {
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
  careerGoals: {
    type: DataTypes.JSONB,
    defaultValue: {
      shortTerm: [],
      longTerm: [],
      targetRoles: []
    }
  },
  salaryExpectations: {
    type: DataTypes.JSONB,
    defaultValue: {
      min: null,
      max: null,
      preferred: null,
      currency: 'USD'
    }
  },
  preferredLocations: {
    type: DataTypes.JSONB,
    defaultValue: {
      locations: [],
      isRemotePreferred: true,
      isHybridPreferred: true,
      isOnsitePreferred: false
    }
  },
  preferredTechnologies: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  weaknessAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {
      skills: [],
      experience: [],
      recommendations: []
    }
  },
  growthRecommendations: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  lastUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { unique: true, fields: ['candidate_id'] }
  ]
});

export default CareerTwin;
