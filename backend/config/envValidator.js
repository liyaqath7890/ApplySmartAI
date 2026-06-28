/**
 * Environment Variable Validator
 * Validates all required environment variables on startup.
 * Fails fast in production; warns in development.
 */

const ENV_RULES = [
  // ── Server ────────────────────────────────────────────────────────────────
  { key: 'JWT_SECRET',           required: true,  minLength: 32,  description: 'JWT signing secret (≥32 chars)' },
  { key: 'JWT_REFRESH_SECRET',   required: true,  minLength: 32,  description: 'JWT refresh signing secret (≥32 chars)' },
  { key: 'DB_HOST',              required: true,  description: 'PostgreSQL host' },
  { key: 'DB_NAME',              required: true,  description: 'PostgreSQL database name' },
  { key: 'DB_USER',              required: true,  description: 'PostgreSQL username' },
  { key: 'DB_PASSWORD',          required: false, description: 'PostgreSQL password' },

  // ── OpenAI ────────────────────────────────────────────────────────────────
  { key: 'OPENAI_API_KEY',       required: false, description: 'OpenAI API key' },

  // ── Redis ─────────────────────────────────────────────────────────────────
  { key: 'REDIS_HOST',           required: false, description: 'Redis host (defaults to localhost)' },
  { key: 'REDIS_PORT',           required: false, isNumber: true, description: 'Redis port' },

  // ── Job Aggregation APIs ──────────────────────────────────────────────────
  { key: 'ADZUNA_APP_ID',        required: false, description: 'Adzuna App ID' },
  { key: 'ADZUNA_API_KEY',       required: false, description: 'Adzuna API key' },
  { key: 'RAPIDAPI_KEY',         required: false, description: 'RapidAPI key (JSearch)' },
  { key: 'USAJOBS_API_KEY',      required: false, description: 'USAJobs API key' },

  // ── Email ─────────────────────────────────────────────────────────────────
  { key: 'SMTP_HOST',            required: false, description: 'SMTP host' },
  { key: 'SMTP_USER',            required: false, description: 'SMTP username' },
  { key: 'SMTP_PASS',            required: false, description: 'SMTP password' },

  // ── Storage (optional cloud providers) ───────────────────────────────────
  { key: 'AWS_ACCESS_KEY_ID',    required: false, description: 'AWS access key' },
  { key: 'AWS_SECRET_ACCESS_KEY',required: false, description: 'AWS secret key' },
  { key: 'AWS_BUCKET_NAME',      required: false, description: 'S3 bucket name' },

  // ── Stripe (optional billing) ─────────────────────────────────────────────
  { key: 'STRIPE_SECRET_KEY',    required: false, description: 'Stripe secret key' },

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  { key: 'RATE_LIMIT_WINDOW_MS', required: false, isNumber: true, description: 'Rate limit window in ms' },
  { key: 'RATE_LIMIT_MAX_REQUESTS', required: false, isNumber: true, description: 'Max requests per window' },
];

/**
 * Validates all environment variables.
 * @param {boolean} strict - If true, missing required vars throw; otherwise warns.
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateEnv(strict = (process.env.NODE_ENV === 'production')) {
  const errors = [];
  const warnings = [];

  for (const rule of ENV_RULES) {
    const value = process.env[rule.key];

    if (!value) {
      if (rule.required) {
        errors.push(`[MISSING] ${rule.key}: ${rule.description}`);
      } else {
        warnings.push(`[OPTIONAL] ${rule.key} not set — ${rule.description}`);
      }
      continue;
    }

    if (rule.minLength && value.length < rule.minLength) {
      const msg = `[WEAK] ${rule.key} is only ${value.length} chars (minimum: ${rule.minLength})`;
      if (strict) errors.push(msg);
      else warnings.push(msg);
    }

    if (rule.isNumber && isNaN(Number(value))) {
      errors.push(`[INVALID] ${rule.key} must be a number, got: "${value}"`);
    }
  }

  // JWT secrets must differ
  if (
    process.env.JWT_SECRET &&
    process.env.JWT_REFRESH_SECRET &&
    process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET
  ) {
    const msg = '[SECURITY] JWT_SECRET and JWT_REFRESH_SECRET must be different values';
    if (strict) errors.push(msg);
    else warnings.push(msg);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Runs validation and either throws (production) or logs (development).
 * Call this at the very top of src/server.js before anything else.
 */
export function validateEnvOrFail() {
  const isProduction = process.env.NODE_ENV === 'production';
  const { valid, errors, warnings } = validateEnv(isProduction);

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    warnings.forEach(w => console.warn(`   ${w}`));
  }

  if (!valid) {
    console.error('\n❌ Environment Validation FAILED:');
    errors.forEach(e => console.error(`   ${e}`));

    if (isProduction) {
      console.error('\n💥 Refusing to start in production with invalid configuration.');
      process.exit(1);
    } else {
      console.warn('\n⚠️  Starting in development mode despite config errors.\n');
    }
  } else {
    console.log('✅ Environment validation passed.');
  }
}

export default validateEnvOrFail;
