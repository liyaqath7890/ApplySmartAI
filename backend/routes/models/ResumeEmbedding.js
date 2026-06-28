import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const ResumeEmbedding = sequelize.define('ResumeEmbedding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  resumeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'resume_id',
    references: {
      model: 'Resume',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  embedding: {
    type: DataTypes.ARRAY(DataTypes.FLOAT),
    allowNull: false
  },
  embeddingModel: {
    type: DataTypes.STRING,
    defaultValue: 'text-embedding-3-small'
  },
  contentHash: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['resume_id'], unique: true },
    { fields: ['embedding_model'] }
  ]
});

export default ResumeEmbedding;
