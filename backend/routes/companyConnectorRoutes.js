/**
 * Company Connector Routes
 *
 * GET  /api/company-connectors              — list registered companies
 * GET  /api/company-connectors/health       — health of all connectors
 * GET  /api/company-connectors/:companyId   — fetch jobs for a specific company
 * POST /api/company-connectors/register     — register a new company connector (admin)
 * DELETE /api/company-connectors/cache      — clear connector cache (admin)
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import CompanyConnectorService from '../services/CompanyConnectorService.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { aggregationLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// List all registered companies
router.get('/', protect, (req, res) => {
  const companies = CompanyConnectorService.listCompanies();
  res.json({ success: true, count: companies.length, data: companies });
});

// Health status of all connectors
router.get('/health', protect, (req, res) => {
  const health = CompanyConnectorService.getHealthStatus();
  res.json({ success: true, ...health });
});

// Fetch jobs from a specific company
router.get('/:companyId', protect, aggregationLimiter, catchAsync(async (req, res, next) => {
  const { companyId } = req.params;
  const { page = 1, keyword = '', forceRefresh = false, allPages = false } = req.query;

  try {
    const jobs = allPages === 'true'
      ? await CompanyConnectorService.fetchAllPages(companyId, { keyword, forceRefresh: forceRefresh === 'true' })
      : await CompanyConnectorService.fetchCompanyJobs(companyId, {
          page: parseInt(page),
          keyword,
          forceRefresh: forceRefresh === 'true',
        });

    res.json({
      success: true,
      company: companyId,
      count:   jobs.length,
      page:    parseInt(page),
      data:    jobs,
    });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
}));

// Register a new company connector (admin)
router.post('/register', protect, requirePermission('admin:queues'), catchAsync(async (req, res, next) => {
  const { companyId, platform } = req.body;

  if (!companyId || !platform) {
    return next(new AppError('companyId and platform are required', 400));
  }

  try {
    CompanyConnectorService.addCompany(companyId, platform);
    res.status(201).json({ success: true, message: `Registered ${companyId} → ${platform}` });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
}));

// Clear connector cache (admin)
router.delete('/cache', protect, requirePermission('admin:queues'), (req, res) => {
  const { companyId } = req.query;
  CompanyConnectorService.clearCache(companyId || null);
  res.json({ success: true, message: companyId ? `Cache cleared for ${companyId}` : 'All cache cleared' });
});

export default router;
