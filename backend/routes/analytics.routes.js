import { Router } from 'express';
import { getDashboard, getWeekly, getProductivityDNA } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.get('/weekly', getWeekly);
router.get('/productivity-dna', getProductivityDNA);

export default router;
