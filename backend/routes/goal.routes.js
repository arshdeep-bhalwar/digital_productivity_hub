import { Router } from 'express';
import { listGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goal.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
