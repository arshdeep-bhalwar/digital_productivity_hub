import { Router } from 'express';
import { listHabits, createHabit, logHabit, deleteHabit } from '../controllers/habit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listHabits);
router.post('/', createHabit);
router.post('/:id/log', logHabit);
router.delete('/:id', deleteHabit);

export default router;
