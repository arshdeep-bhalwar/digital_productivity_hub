import * as projectService from '../services/project.service.js';

export async function listProjects(req, res, next) {
  try {
    const projects = await projectService.getProjects(req.supabase, req.user.id);
    res.json({
      success: true,
      data: { projects },
      message: 'Projects retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.supabase, req.user.id, req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found.' },
      });
    }

    res.json({
      success: true,
      data: { project },
      message: 'Project retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const { name, description, deadline, subtasks } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Project name is required.' },
      });
    }

    const project = await projectService.createProject(req.supabase, req.user.id, {
      name: name.trim(),
      description: description || '',
      deadline: deadline || null,
      subtasks: subtasks || [],
    });

    res.status(201).json({
      success: true,
      data: { project },
      message: 'Project created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function addSubtask(req, res, next) {
  try {
    const { title, estimated_minutes } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Subtask title is required.' },
      });
    }

    const subtask = await projectService.addSubtask(req.supabase, req.user.id, req.params.id, {
      title: title.trim(),
      estimated_minutes: Number(estimated_minutes) || 30,
    });

    if (!subtask) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found.' },
      });
    }

    res.status(201).json({
      success: true,
      data: { subtask },
      message: 'Subtask added successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function completeSubtask(req, res, next) {
  try {
    const updatedSubtask = await projectService.completeSubtask(req.supabase, req.user.id, req.params.id);
    if (!updatedSubtask) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Subtask not found or access denied.' },
      });
    }

    res.json({
      success: true,
      data: { subtask: updatedSubtask },
      message: 'Subtask completed successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const deleted = await projectService.deleteProject(req.supabase, req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found or access denied.' },
      });
    }

    res.json({
      success: true,
      data: { id: req.params.id },
      message: 'Project deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
