import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const JobEmbedding = sequelize.define('JobEmbedding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Job',
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
    { fields: ['job_id'], unique: true },
    { fields: ['embedding_model'] }
  ]
});

export default JobEmbedding;
