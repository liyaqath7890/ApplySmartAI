/**
 * Migration: Extend ExternalJob.platform ENUM
 *
 * Adds new aggregation platform values to the existing Postgres ENUM type.
 * Safe to run multiple times (checks before adding).
 *
 * Run with:
 *   node backend/migrations/001_extend_external_job_platform_enum.cjs
 */

'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ai_job_agent',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  }
);

const NEW_VALUES = [
  'adzuna', 'jsearch', 'arbeitnow', 'remoteok', 'remotive',
  'usajobs', 'greenhouse', 'lever', 'ashby', 'rss', 'company-career',
];

async function up() {
  const tx = await sequelize.transaction();

  try {
    for (const value of NEW_VALUES) {
      // PostgreSQL requires ALTER TYPE ... ADD VALUE — safe to call even if value exists
      await sequelize.query(
        `DO $$ BEGIN
           ALTER TYPE "enum_ExternalJob_platform" ADD VALUE IF NOT EXISTS '${value}';
         EXCEPTION WHEN duplicate_object THEN NULL;
         END $$;`,
        { transaction: tx }
      );
      console.log(`✅ Added ENUM value: ${value}`);
    }

    await tx.commit();
    console.log('✅ Migration 001 complete');
  } catch (err) {
    await tx.rollback();
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await sequelize.close();
  }
}

up().catch(err => {
  console.error(err);
  process.exit(1);
});
