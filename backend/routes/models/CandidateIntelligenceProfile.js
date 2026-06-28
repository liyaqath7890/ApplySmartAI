import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const CandidateIntelligenceProfile = sequelize.define('CandidateIntelligenceProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'User', key: 'id' },
    onDelete: 'CASCADE'
  },
  candidateType: {
    type: DataTypes.ENUM(
      'FRESHER',
      'INTERN',
      'STARTUP_EMPLOYEE',
      'CAREER_SWITCHER',
      'RETURN_TO_WORK',
      'JUNIOR_PROFESSIONAL'
    ),
    allowNull: false,
    defaultValue: 'FRESHER'
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  internships: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  startupExperience: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  nonTechWorkExperience: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  projects: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  careerGoals: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  preferredRoles: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  preferredLocations: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  salaryExpectations: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  strengthAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  gapExplanations: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['candidate_type'] }
  ]
});

export default CandidateIntelligenceProfile;
