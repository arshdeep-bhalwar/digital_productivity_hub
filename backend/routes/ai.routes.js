import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  handleBrainDump,
  handleAskAssistant,
  handleProjectBreakdown,
  handleStudyPlan,
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Rate limiting on AI endpoints (max 15 requests per 15 minutes per IP)
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests to AI Assistant. Please wait a few minutes before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(requireAuth);
router.use(aiRateLimiter);

router.post('/brain-dump', handleBrainDump);
router.post('/ask', handleAskAssistant);
router.post('/project-breakdown', handleProjectBreakdown);
router.post('/study-plan', handleStudyPlan);

export default router;
