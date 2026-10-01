import * as focusService from '../services/focus.service.js';

export async function startSession(req, res, next) {
  try {
    const { taskId } = req.body;
    const session = await focusService.startFocusSession(req.supabase, req.user.id, taskId);

    res.status(201).json({
      success: true,
      data: { session },
      message: 'Focus session started.',
    });
  } catch (err) {
    next(err);
  }
}

export async function completeSession(req, res, next) {
  try {
    const { sessionId, taskId, durationMinutes, completed } = req.body;

    if (durationMinutes === undefined || isNaN(durationMinutes) || Number(durationMinutes) < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid non-negative duration in minutes is required.',
        },
      });
    }

    const session = await focusService.completeFocusSession(req.supabase, req.user.id, {
      sessionId,
      taskId,
      durationMinutes,
      completed: completed !== false,
    });

    res.json({
      success: true,
      data: { session },
      message: session.completed ? 'Focus session completed successfully.' : 'Focus session saved.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const history = await focusService.getFocusHistory(req.supabase, req.user.id);

    res.json({
      success: true,
      data: { sessions: history },
      message: 'Focus session history retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}
