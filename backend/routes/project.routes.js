import { Router } from 'express';
import { listProjects, getProject, createProject, addSubtask, completeSubtask, deleteProject } from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);
router.post('/:id/subtasks', addSubtask);
router.patch('/subtasks/:id/complete', completeSubtask);

export default router;
