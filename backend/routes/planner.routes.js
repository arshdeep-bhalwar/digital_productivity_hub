import { Router } from 'express';
import { generatePlan, getPlan, savePlan } from '../controllers/planner.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/generate', generatePlan);
router.get('/:date', getPlan);
router.put('/:date', savePlan);

export default router;
