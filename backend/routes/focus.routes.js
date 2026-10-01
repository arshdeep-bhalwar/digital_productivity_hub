import { Router } from 'express';
import { startSession, completeSession, getHistory } from '../controllers/focus.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/start', startSession);
router.post('/complete', completeSession);
router.get('/history', getHistory);

export default router;
