import * as goalService from '../services/goal.service.js';

export async function listGoals(req, res, next) {
  try {
    const goals = await goalService.getGoals(req.supabase, req.user.id);
    res.json({
      success: true,
      data: { goals },
      message: 'Goals retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req, res, next) {
  try {
    const { title, description, target_date, progress } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Goal title is required.' },
      });
    }

    const goal = await goalService.createGoal(req.supabase, req.user.id, {
      title: title.trim(),
      description: description || '',
      target_date: target_date || null,
      progress: Number(progress) || 0,
    });

    res.status(201).json({
      success: true,
      data: { goal },
      message: 'Goal created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req, res, next) {
  try {
    const updated = await goalService.updateGoal(req.supabase, req.user.id, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Goal not found or access denied.' },
      });
    }

    res.json({
      success: true,
      data: { goal: updated },
      message: 'Goal updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req, res, next) {
  try {
    const deleted = await goalService.deleteGoal(req.supabase, req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Goal not found or access denied.' },
      });
    }

    res.json({
      success: true,
      data: { id: req.params.id },
      message: 'Goal deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
