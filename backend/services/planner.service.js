import { calculatePriorityScore } from './priority.service.js';
import { calculateDeadlineRisk } from './risk.service.js';

const mockPlanStore = new Map();

/**
 * Generate a smart daily schedule from pending tasks, availability, and fixed commitments.
 */
export function generateSmartDayPlan(tasks, options = {}) {
  const availableMinutes = options.availableMinutes !== undefined ? Number(options.availableMinutes) : 240; // Default 4 hours
  const startHour = Number(options.startHour) || 9; // Default 9:00 AM
  const planDate = options.planDate || new Date().toISOString().split('T')[0];
  const fixedCommitments = options.fixedCommitments || [];

  if (availableMinutes <= 0) {
    return {
      planDate,
      availableMinutes: 0,
      plannedMinutes: 0,
      completionPercentage: 0,
      warning: 'Available time is set to 0 minutes. Increase available hours to generate a plan.',
      items: [],
    };
  }

  // Filter tasks to pending or in_progress
  const eligibleTasks = (tasks || []).filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  if (eligibleTasks.length === 0) {
    return {
      planDate,
      availableMinutes,
      plannedMinutes: 0,
      completionPercentage: 0,
      message: 'No pending tasks available for planning. Add tasks or run Brain Dump.',
      items: [],
    };
  }

  // Calculate priority score & deadline risk for each task
  const scoredTasks = eligibleTasks.map(task => {
    const pScore = calculatePriorityScore(task);
    const dRisk = calculateDeadlineRisk(task, availableMinutes);
    return {
      ...task,
      priorityScore: pScore.score,
      riskLevel: dRisk.level,
    };
  });

  // Sort by priority score descending
  scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);

  let remainingAvailableMins = availableMinutes;
  let currentMoment = new Date(`${planDate}T${String(startHour).padStart(2, '0')}:00:00Z`);
  const planItems = [];
  let totalPlannedMins = 0;
  let orderIndex = 0;

  for (const task of scoredTasks) {
    if (remainingAvailableMins <= 0) break;

    const taskEstMins = Math.max(15, Number(task.estimated_minutes) || 30);
    // Allocate max possible duration up to task estimation and remaining daily capacity
    const allocMins = Math.min(taskEstMins, remainingAvailableMins);

    if (allocMins < 15) break;

    const blockStart = new Date(currentMoment);
    const blockEnd = new Date(currentMoment.getTime() + allocMins * 60 * 1000);

    planItems.push({
      task_id: task.id,
      title: task.title,
      category: task.category,
      priority: task.priority,
      priorityScore: task.priorityScore,
      riskLevel: task.riskLevel,
      start_time: blockStart.toISOString(),
      end_time: blockEnd.toISOString(),
      duration_minutes: allocMins,
      order_index: orderIndex++,
    });

    totalPlannedMins += allocMins;
    remainingAvailableMins -= allocMins;

    // Add 10-minute break buffer between task blocks if time remains
    let breakMins = 0;
    if (remainingAvailableMins >= 15) {
      breakMins = 10;
      remainingAvailableMins -= breakMins;
    }

    currentMoment = new Date(blockEnd.getTime() + breakMins * 60 * 1000);
  }

  return {
    planDate,
    availableMinutes,
    plannedMinutes: totalPlannedMins,
    completionPercentage: 0,
    items: planItems,
  };
}

export async function saveDailyPlan(supabase, userId, planData) {
  const planRecord = {
    id: planData.id || crypto.randomUUID(),
    user_id: userId,
    plan_date: planData.planDate,
    available_minutes: planData.availableMinutes,
    planned_minutes: planData.plannedMinutes,
    completion_percentage: planData.completionPercentage || 0,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    // Upsert daily plan record
    const { data: upsertedPlan, error: planErr } = await supabase
      .from('daily_plans')
      .upsert(planRecord, { onConflict: 'user_id, plan_date' })
      .select()
      .single();

    if (planErr) throw planErr;

    // Delete previous items for this plan
    await supabase.from('plan_items').delete().eq('daily_plan_id', upsertedPlan.id);

    // Insert new plan items
    if (planData.items && planData.items.length > 0) {
      const itemsToInsert = planData.items.map((item, idx) => ({
        daily_plan_id: upsertedPlan.id,
        task_id: item.task_id || null,
        start_time: item.start_time,
        end_time: item.end_time,
        order_index: idx,
      }));

      const { error: itemsErr } = await supabase.from('plan_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }

    return getDailyPlan(supabase, userId, planData.planDate);
  }

  // Fallback mock store
  const key = `${userId}:${planData.planDate}`;
  mockPlanStore.set(key, { ...planRecord, items: planData.items || [] });
  return mockPlanStore.get(key);
}

export async function getDailyPlan(supabase, userId, planDate) {
  if (supabase) {
    const { data: plan, error } = await supabase
      .from('daily_plans')
      .select('*, plan_items(*, tasks(*))')
      .eq('user_id', userId)
      .eq('plan_date', planDate)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return plan || null;
  }

  const key = `${userId}:${planDate}`;
  return mockPlanStore.get(key) || null;
}
