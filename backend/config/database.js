import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log('====================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('====================');

const environment = process.env.NODE_ENV || 'development';

const config = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ai_job_agent',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_TEST_NAME || 'ai_job_agent_test',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

const sequelize = new Sequelize(
  config[environment].database,
  config[environment].username,
  config[environment].password,
  {
    host: config[environment].host,
    port: config[environment].port,
    dialect: config[environment].dialect,
    logging: config[environment].logging,
    pool: config[environment].pool,
    dialectOptions: config[environment].dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ DATABASE CONNECTION ERROR');
    console.error(error);
    return false;
  }
};

export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');

    // Custom migration to alter Application table status and add new columns
    try {
      await sequelize.query('ALTER TABLE "Application" ALTER COLUMN status TYPE VARCHAR(255);');
      await sequelize.query(`ALTER TABLE "Application" ALTER COLUMN status SET DEFAULT 'imported';`);
      await sequelize.query('ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;');
      await sequelize.query('ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS recruiter VARCHAR(255);');
      await sequelize.query('ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS salary VARCHAR(255);');
      await sequelize.query(`ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS documents_used JSONB DEFAULT '{}'::jsonb;`);
      
      // Recruiter CRM column alerts
      await sequelize.query('ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT \'medium\';');
      await sequelize.query('ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;');
      await sequelize.query('ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS company_id UUID;');
      await sequelize.query('ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS application_id UUID;');
      console.log('✅ Database custom migrations executed successfully.');
    } catch (err) {
      console.warn('⚠️ Custom migrations skipped or failed:', err.message);
    }
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

export default sequelize;