/**
 * Company Routes (v1.1)
 * All company data is database-driven.
 * No hardcoded mappings.
 */

import express from 'express';
import { protect as authenticateToken } from '../middleware/auth.js';
import connectorService from '../services/CompanyConnectorService.js';
import companyInsightService from '../services/CompanyInsightService.js';
import { Company, SavedCompany, CandidateProfile } from './models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// ── GET /api/companies ─────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      industry, ats, size, remote, hybrid, internship, fresherFriendly,
      verificationStatus, hiringStatus, category, page = 1, limit = 50, search
    } = req.query;

    const where = { activeStatus: true };
    if (industry) where.industry = industry;
    if (ats) where.atsPlatform = ats;
    if (size) where.size = size;
    if (remote === 'true') where.remoteAvailable = true;
    if (hybrid === 'true') where.hybridAvailable = true;
    if (internship === 'true') where.internshipAvailable = true;
    if (fresherFriendly === 'true') where.fresherFriendly = true;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (hiringStatus) where.hiringStatus = hiringStatus;
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { industry: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Company.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      companies: rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/companies/providers ──────────────────────────────────────────────
router.get('/providers', authenticateToken, (_req, res) => {
  res.json({ success: true, providers: connectorService.listProviders() });
});

// ── GET /api/companies/health ─────────────────────────────────────────────────
router.get('/health', authenticateToken, async (_req, res) => {
  try {
    const status = await connectorService.getHealthStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/companies ───────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const company = await connectorService.registerCompany(req.body);
    res.status(201).json({ success: true, company });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── POST /api/companies/discover ──────────────────────────────────────────────
router.post('/discover', authenticateToken, async (req, res) => {
  try {
    const { default: discoveryEngine } = await import('../services/jobAggregation/CompanyDiscoveryEngine.js');
    const company = await discoveryEngine.discoverCompanyFromJob(req.body);
    if (!company) {
      return res.status(400).json({ success: false, error: 'Could not discover ATS company from the provided URL' });
    }
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/companies/:id ────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/companies/:id ──────────────────────────────────────────────────
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    await company.update(req.body);
    res.json({ success: true, company });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/companies/:id ─────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    await company.update({ activeStatus: false });
    res.json({ success: true, message: 'Company deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/companies/:id/jobs ───────────────────────────────────────────────
router.get('/:id/jobs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, keyword = '', forceRefresh = 'false' } = req.query;
    const jobs = await connectorService.fetchCompanyJobs(req.params.id, {
      page: parseInt(page),
      keyword,
      forceRefresh: forceRefresh === 'true'
    });
    res.json({ success: true, jobCount: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/companies/:id/sync ──────────────────────────────────────────────
router.post('/:id/sync', authenticateToken, async (req, res) => {
  try {
    const jobs = await connectorService.fetchCompanyJobs(req.params.id, { forceRefresh: true });
    res.json({ success: true, synced: jobs.length, message: `Synced ${jobs.length} jobs` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/companies/:id/test-connection ───────────────────────────────────
router.post('/:id/test-connection', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    const provider = connectorService.getProvider(company.atsPlatform);
    const result = await provider.testConnection(company);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/companies/:id/logs ───────────────────────────────────────────────
router.get('/:id/logs', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, { attributes: ['id', 'name', 'syncLogs'] });
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.json({ success: true, logs: company.syncLogs || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/companies/:id/insights ───────────────────────────────────────────
router.get('/:id/insights', authenticateToken, async (req, res) => {
  try {
    const insights = await companyInsightService.getInsights(req.params.id);
    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Saved Companies ────────────────────────────────────────────────────────────

// GET /api/companies/interactions - get current user's interacted companies (following, saved, hidden, etc.)
router.get('/interactions', authenticateToken, async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.json({ success: true, interactions: [] });
    
    const interactions = await SavedCompany.findAll({
      where: { candidateProfileId: profile.id },
      include: [{ model: Company, as: 'company' }]
    });
    
    res.json({ success: true, interactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/companies/:id/interaction - Unified interaction endpoint
router.post('/:id/interaction', authenticateToken, async (req, res) => {
  try {
    const { isFollowing, isBookmarked, isHidden, isFavorite } = req.body;
    const profile = await CandidateProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(400).json({ success: false, error: 'Profile not found' });
    
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    
    const [interaction, created] = await SavedCompany.findOrCreate({
      where: { candidateProfileId: profile.id, companyId: req.params.id },
      defaults: { isFollowing: false, isBookmarked: false, isHidden: false, isFavorite: false }
    });
    
    // Update only provided fields
    if (isFollowing !== undefined) interaction.isFollowing = isFollowing;
    if (isBookmarked !== undefined) interaction.isBookmarked = isBookmarked;
    if (isHidden !== undefined) interaction.isHidden = isHidden;
    if (isFavorite !== undefined) interaction.isFavorite = isFavorite;
    
    await interaction.save();
    
    res.json({ success: true, interaction, created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/companies/:id/notifications - Update notification preferences
router.put('/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const { notificationPreferences } = req.body;
    const profile = await CandidateProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(400).json({ success: false, error: 'Profile not found' });
    
    const interaction = await SavedCompany.findOne({
      where: { candidateProfileId: profile.id, companyId: req.params.id }
    });
    
    if (!interaction) {
      return res.status(404).json({ success: false, error: 'Company interaction not found. You must follow or bookmark first.' });
    }
    
    interaction.notificationPreferences = { ...interaction.notificationPreferences, ...notificationPreferences };
    await interaction.save();
    
    res.json({ success: true, notificationPreferences: interaction.notificationPreferences });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Backward compatibility
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(400).json({ success: false, error: 'Profile not found' });
    
    const [saved, created] = await SavedCompany.findOrCreate({
      where: { candidateProfileId: profile.id, companyId: req.params.id }
    });
    
    saved.isBookmarked = true;
    await saved.save();
    
    res.json({ success: true, saved: created, savedCompany: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id/save', authenticateToken, async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(400).json({ success: false, error: 'Profile not found' });
    
    const interaction = await SavedCompany.findOne({
      where: { candidateProfileId: profile.id, companyId: req.params.id }
    });
    
    if (interaction) {
      interaction.isBookmarked = false;
      await interaction.save();
      // If it's not followed or hidden either, we could potentially delete it, but keeping it is safer.
    }
    
    res.json({ success: true, message: 'Removed from saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
