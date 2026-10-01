import * as taskService from './task.service.js';
import * as focusService from './focus.service.js';
import * as goalService from './goal.service.js';
import * as habitService from './habit.service.js';

export async function getDashboardAnalytics(supabase, userId) {
  const tasks = await taskService.getTasks(supabase, userId);
  const focusSessions = await focusService.getFocusHistory(supabase, userId);
  const goals = await goalService.getGoals(supabase, userId);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  const now = new Date();
  const overdueTasks = pendingTasks.filter(t => t.deadline && new Date(t.deadline) < now);

  const completedFocusSessions = focusSessions.filter(s => s.completed && s.duration_minutes > 0);
  const totalFocusMinutes = completedFocusSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const averageFocusMinutes = completedFocusSessions.length > 0 ? Math.round(totalFocusMinutes / completedFocusSessions.length) : 0;

  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const goalProgressSum = goals.reduce((acc, g) => acc + (g.progress || 0), 0);
  const goalProgressAvg = goals.length > 0 ? Math.round(goalProgressSum / goals.length) : 0;

  // Deadline Management score (% of completed tasks done before deadline)
  const tasksWithDeadline = completedTasks.filter(t => t.deadline);
  const onTimeTasks = tasksWithDeadline.filter(t => t.completed_at && new Date(t.completed_at) <= new Date(t.deadline));
  const deadlineManagementScore = tasksWithDeadline.length > 0 ? Math.round((onTimeTasks.length / tasksWithDeadline.length) * 100) : 100;

  // Focus Consistency score (target 120 mins focus per week = 100%)
  const focusConsistencyScore = Math.min(100, Math.round((totalFocusMinutes / 120) * 100));

  // Overall Productivity Score formula
  const productivityScore = totalTasks === 0 && completedFocusSessions.length === 0
    ? 0
    : Math.round(
        taskCompletionRate * 0.35 +
        focusConsistencyScore * 0.25 +
        deadlineManagementScore * 0.20 +
        goalProgressAvg * 0.20
      );

  const hasSufficientData = totalTasks > 0 || completedFocusSessions.length > 0 || goals.length > 0;

  return {
    hasSufficientData,
    emptyMessage: hasSufficientData ? null : 'Not enough activity yet. Complete a few tasks and focus sessions to unlock your insights.',
    productivityScore,
    totalTasks,
    completedTasksCount: completedTasks.length,
    pendingTasksCount: pendingTasks.length,
    overdueTasksCount: overdueTasks.length,
    taskCompletionRate,
    totalFocusMinutes,
    totalFocusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
    averageFocusMinutes,
    completedFocusSessionsCount: completedFocusSessions.length,
    goalProgressAvg,
    deadlineManagementScore,
  };
}

export async function getWeeklyAnalytics(supabase, userId) {
  const focusSessions = await focusService.getFocusHistory(supabase, userId);
  const tasks = await taskService.getTasks(supabase, userId);

  // Group focus minutes and completed tasks by past 7 days
  const days = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayFocusMins = focusSessions
      .filter(s => s.completed && s.start_time && s.start_time.startsWith(dateStr))
      .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    const dayCompletedTasks = tasks.filter(t => t.completed_at && t.completed_at.startsWith(dateStr)).length;

    days.push({
      date: dateStr,
      day: dayLabel,
      focusMinutes: dayFocusMins,
      completedTasks: dayCompletedTasks,
    });
  }

  // Category distribution
  const categoryCounts = {};
  tasks.forEach(t => {
    const cat = t.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return {
    weeklyDays: days,
    categoryDistribution: categoryCounts,
  };
}

export async function getProductivityDNA(supabase, userId) {
  const dashboard = await getDashboardAnalytics(supabase, userId);
  const focusSessions = await focusService.getFocusHistory(supabase, userId);

  if (!dashboard.hasSufficientData) {
    return {
      hasSufficientData: false,
      emptyMessage: 'Not enough activity yet. Complete a few tasks and focus sessions to unlock your productivity insights.',
      traits: null,
    };
  }

  // Calculate peak productive time block from completed focus session start times
  const hourCounts = new Array(24).fill(0);
  focusSessions.filter(s => s.completed && s.start_time).forEach(s => {
    const hour = new Date(s.start_time).getHours();
    hourCounts[hour]++;
  });

  let peakHour = 14; // Default afternoon
  let maxCount = -1;
  hourCounts.forEach((cnt, hr) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      peakHour = hr;
    }
  });

  let mostProductivePeriod = 'Afternoon (12 PM – 4 PM)';
  if (peakHour >= 6 && peakHour < 12) mostProductivePeriod = 'Morning (6 AM – 12 PM)';
  else if (peakHour >= 12 && peakHour < 17) mostProductivePeriod = 'Afternoon (12 PM – 5 PM)';
  else if (peakHour >= 17 && peakHour < 22) mostProductivePeriod = 'Evening (5 PM – 10 PM)';
  else mostProductivePeriod = 'Night (10 PM – 6 AM)';

  return {
    hasSufficientData: true,
    traits: {
      focusScore: Math.min(100, dashboard.completedFocusSessionsCount * 20),
      consistencyScore: dashboard.deadlineManagementScore,
      planningScore: Math.min(100, Math.round((dashboard.completedTasksCount / Math.max(1, dashboard.totalTasks)) * 100)),
      executionScore: dashboard.taskCompletionRate,
      mostProductivePeriod,
      averageFocusSession: `${dashboard.averageFocusMinutes} minutes`,
      observableSummary: `You have completed ${dashboard.completedTasksCount} tasks and logged ${dashboard.totalFocusHours} hours of focus time. Most focus activity occurs during ${mostProductivePeriod.toLowerCase()}.`,
    },
  };
}
