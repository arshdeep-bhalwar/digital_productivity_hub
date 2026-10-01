import { Router } from 'express';
import { listTasks, getTask, createTask, updateTask, deleteTask, completeTask } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', completeTask);

export default router;
