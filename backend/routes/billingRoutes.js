import express from 'express';
import {
  getPlans,
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  handleWebhook
} from '../controllers/billingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/plans', getPlans);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(protect);
router.post('/checkout', createCheckoutSession);
router.get('/subscription', getSubscription);
router.post('/subscription/cancel', cancelSubscription);

export default router;
