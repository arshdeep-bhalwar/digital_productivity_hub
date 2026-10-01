import * as habitService from '../services/habit.service.js';

export async function listHabits(req, res, next) {
  try {
    const todayStr = req.query.date || new Date().toISOString().split('T')[0];
    const habits = await habitService.getHabits(req.supabase, req.user.id, todayStr);

    res.json({
      success: true,
      data: { habits },
      message: 'Habits retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function createHabit(req, res, next) {
  try {
    const { name, frequency } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Habit name is required.' },
      });
    }

    const habit = await habitService.createHabit(req.supabase, req.user.id, {
      name: name.trim(),
      frequency: frequency || 'daily',
    });

    res.status(201).json({
      success: true,
      data: { habit },
      message: 'Habit created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function logHabit(req, res, next) {
  try {
    const { date, completed } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];

    const log = await habitService.logHabitCompletion(req.supabase, req.user.id, req.params.id, logDate, completed !== false);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Habit not found or access denied.' },
      });
    }

    res.json({
      success: true,
      data: { log },
      message: 'Habit completion logged successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(req, res, next) {
  try {
    const deleted = await habitService.deleteHabit(req.supabase, req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Habit not found or access denied.' },
      });
    }

    res.json({
      success: true,
      data: { id: req.params.id },
      message: 'Habit deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
