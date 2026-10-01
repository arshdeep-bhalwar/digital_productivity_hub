import * as plannerService from '../services/planner.service.js';
import * as taskService from '../services/task.service.js';

export async function generatePlan(req, res, next) {
  try {
    const { availableMinutes, startHour, planDate } = req.body;
    const targetDate = planDate || new Date().toISOString().split('T')[0];

    // Fetch user's active tasks
    const tasks = await taskService.getTasks(req.supabase, req.user.id, { status: 'pending' });

    const proposedPlan = plannerService.generateSmartDayPlan(tasks, {
      availableMinutes: Number(availableMinutes) || 240,
      startHour: Number(startHour) || 9,
      planDate: targetDate,
    });

    res.json({
      success: true,
      data: { plan: proposedPlan },
      message: 'Smart daily schedule generated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getPlan(req, res, next) {
  try {
    const planDate = req.params.date || new Date().toISOString().split('T')[0];
    const plan = await plannerService.getDailyPlan(req.supabase, req.user.id, planDate);

    if (!plan) {
      return res.json({
        success: true,
        data: { plan: null },
        message: 'No daily plan found for this date.',
      });
    }

    res.json({
      success: true,
      data: { plan },
      message: 'Daily plan retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function savePlan(req, res, next) {
  try {
    const { planDate, availableMinutes, plannedMinutes, items } = req.body;

    if (!planDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Plan date is required.',
        },
      });
    }

    const savedPlan = await plannerService.saveDailyPlan(req.supabase, req.user.id, {
      planDate,
      availableMinutes: Number(availableMinutes) || 240,
      plannedMinutes: Number(plannedMinutes) || 0,
      items: items || [],
    });

    res.json({
      success: true,
      data: { plan: savedPlan },
      message: 'Daily plan saved successfully.',
    });
  } catch (err) {
    next(err);
  }
}
