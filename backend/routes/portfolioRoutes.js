import express from 'express';
import {
  createPortfolio,
  getPortfolios,
  addProject,
  generatePersonalBrand,
  getPersonalBrands
} from '../controllers/portfolioController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createPortfolio);
router.get('/', getPortfolios);
router.post('/:portfolioId/projects', addProject);
router.post('/personal-brand', generatePersonalBrand);
router.get('/personal-brand', getPersonalBrands);

export default router;
