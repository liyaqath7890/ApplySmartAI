import express from 'express';
import {
  createAgent,
  getAgents,
  executeTask,
  autoApply,
  getAgentTasks,
  getAgentActivities
} from '../controllers/agentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createAgent);
router.get('/', getAgents);
router.post('/execute', executeTask);
router.post('/auto-apply', autoApply);
router.get('/:agentId/tasks', getAgentTasks);
router.get('/:agentId/activities', getAgentActivities);

export default router;
