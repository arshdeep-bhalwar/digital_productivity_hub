import * as taskService from '../services/task.service.js';

const ALLOWED_CATEGORIES = ['Academic', 'Project', 'Career', 'Personal', 'Health', 'Other'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const ALLOWED_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

export async function listTasks(req, res, next) {
  try {
    const { category, status, priority } = req.query;
    const tasks = await taskService.getTasks(req.supabase, req.user.id, { category, status, priority });

    res.json({
      success: true,
      data: { tasks },
      message: 'Tasks retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.supabase, req.user.id, req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found.',
        },
      });
    }

    res.json({
      success: true,
      data: { task },
      message: 'Task retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, description, category, priority, deadline, estimated_minutes } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task title is required.',
        },
      });
    }

    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        },
      });
    }

    if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`,
        },
      });
    }

    if (estimated_minutes !== undefined && (isNaN(estimated_minutes) || Number(estimated_minutes) < 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Estimated minutes must be a non-negative number.',
        },
      });
    }

    const task = await taskService.createTask(req.supabase, req.user.id, {
      title: title.trim(),
      description: description || '',
      category: category || 'Academic',
      priority: priority || 'Medium',
      deadline: deadline || null,
      estimated_minutes: Number(estimated_minutes) || 0,
    });

    res.status(201).json({
      success: true,
      data: { task },
      message: 'Task created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { title, description, category, priority, status, deadline, estimated_minutes } = req.body;

    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        },
      });
    }

    if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`,
        },
      });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
        },
      });
    }

    const updatedTask = await taskService.updateTask(req.supabase, req.user.id, req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found or access denied.',
        },
      });
    }

    res.json({
      success: true,
      data: { task: updatedTask },
      message: 'Task updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const deleted = await taskService.deleteTask(req.supabase, req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found or access denied.',
        },
      });
    }

    res.json({
      success: true,
      data: { id: req.params.id },
      message: 'Task deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function completeTask(req, res, next) {
  try {
    const updatedTask = await taskService.updateTask(req.supabase, req.user.id, req.params.id, {
      status: 'completed',
    });

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found or access denied.',
        },
      });
    }

    res.json({
      success: true,
      data: { task: updatedTask },
      message: 'Task marked as completed.',
    });
  } catch (err) {
    next(err);
  }
}
