const mockHabitStore = new Map();
const mockHabitLogStore = new Map();

/**
 * Calculates current habit streak from completion log dates.
 * Dates are handled as YYYY-MM-DD strings in local timezone context.
 */
export function calculateStreak(logs = [], todayStr = new Date().toISOString().split('T')[0]) {
  if (!logs || logs.length === 0) return 0;

  // Filter to completed logs only and get unique sorted dates descending
  const completedDates = Array.from(
    new Set(
      logs
        .filter(l => l.completed)
        .map(l => l.date)
    )
  ).sort((a, b) => (a < b ? 1 : -1));

  if (completedDates.length === 0) return 0;

  const today = new Date(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Most recent completed date must be today or yesterday to maintain active streak
  const mostRecent = completedDates[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(mostRecent);

  for (const logDateStr of completedDates) {
    const logDate = new Date(logDateStr);

    const diffDays = Math.round((checkDate - logDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function getHabits(supabase, userId, todayStr) {
  if (supabase) {
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*, habit_logs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (habits || []).map(h => {
      const computedStreak = calculateStreak(h.habit_logs || [], todayStr);
      return {
        ...h,
        streak: computedStreak,
      };
    });

    return formatted;
  }

  const userHabits = Array.from(mockHabitStore.values())
    .filter(h => h.user_id === userId)
    .map(h => {
      const logs = Array.from(mockHabitLogStore.values()).filter(l => l.habit_id === h.id);
      return {
        ...h,
        streak: calculateStreak(logs, todayStr),
        habit_logs: logs,
      };
    });

  return userHabits;
}

export async function createHabit(supabase, userId, habitData) {
  const newHabit = {
    id: habitData.id || crypto.randomUUID(),
    user_id: userId,
    name: habitData.name,
    frequency: habitData.frequency || 'daily',
    streak: 0,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('habits')
      .insert(newHabit)
      .select()
      .single();

    if (error) throw error;
    return { ...data, habit_logs: [] };
  }

  mockHabitStore.set(newHabit.id, newHabit);
  return { ...newHabit, habit_logs: [] };
}

export async function logHabitCompletion(supabase, userId, habitId, logDate, completed = true) {
  const targetDate = logDate || new Date().toISOString().split('T')[0];

  if (supabase) {
    // Verify ownership
    const { data: habit, error: hErr } = await supabase
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();

    if (hErr || !habit) return null;

    const { data: log, error: logErr } = await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, date: targetDate, completed }, { onConflict: 'habit_id, date' })
      .select()
      .single();

    if (logErr) throw logErr;

    // Recalculate streak
    const { data: allLogs } = await supabase.from('habit_logs').select('*').eq('habit_id', habitId);
    const newStreak = calculateStreak(allLogs || [], targetDate);
    await supabase.from('habits').update({ streak: newStreak }).eq('id', habitId);

    return log;
  }

  const habit = mockHabitStore.get(habitId);
  if (!habit || habit.user_id !== userId) return null;

  const logKey = `${habitId}:${targetDate}`;
  const log = { id: crypto.randomUUID(), habit_id: habitId, date: targetDate, completed };
  mockHabitLogStore.set(logKey, log);

  const allLogs = Array.from(mockHabitLogStore.values()).filter(l => l.habit_id === habitId);
  const newStreak = calculateStreak(allLogs, targetDate);
  mockHabitStore.set(habitId, { ...habit, streak: newStreak });

  return log;
}

export async function deleteHabit(supabase, userId, habitId) {
  if (supabase) {
    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
    if (error) throw error;
    return true;
  }

  const existing = mockHabitStore.get(habitId);
  if (!existing || existing.user_id !== userId) return false;
  mockHabitStore.delete(habitId);
  return true;
}
