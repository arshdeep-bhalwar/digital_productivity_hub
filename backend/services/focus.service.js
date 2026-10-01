const mockFocusStore = new Map();

export async function startFocusSession(supabase, userId, taskId) {
  const newSession = {
    id: crypto.randomUUID(),
    user_id: userId,
    task_id: taskId || null,
    start_time: new Date().toISOString(),
    end_time: null,
    duration_minutes: 0,
    completed: false,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(newSession)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  mockFocusStore.set(newSession.id, newSession);
  return newSession;
}

export async function completeFocusSession(supabase, userId, sessionData) {
  const { sessionId, durationMinutes, taskId, completed } = sessionData;
  const actualDuration = Math.max(0, Math.floor(Number(durationMinutes) || 0));

  // Count session as completed ONLY if actual focus time (> 0 mins) was recorded
  const isCompleted = Boolean(completed) && actualDuration > 0;
  const endTime = new Date().toISOString();

  if (supabase) {
    let targetSessionId = sessionId;

    if (!targetSessionId) {
      // Insert new completed focus session record
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          task_id: taskId || null,
          start_time: new Date(Date.now() - actualDuration * 60 * 1000).toISOString(),
          end_time: endTime,
          duration_minutes: actualDuration,
          completed: isCompleted,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        end_time: endTime,
        duration_minutes: actualDuration,
        completed: isCompleted,
      })
      .eq('id', targetSessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Fallback mock store
  const existing = mockFocusStore.get(sessionId) || {
    id: sessionId || crypto.randomUUID(),
    user_id: userId,
    task_id: taskId || null,
    start_time: new Date(Date.now() - actualDuration * 60 * 1000).toISOString(),
  };

  const updated = {
    ...existing,
    end_time: endTime,
    duration_minutes: actualDuration,
    completed: isCompleted,
  };

  mockFocusStore.set(updated.id, updated);
  return updated;
}

export async function getFocusHistory(supabase, userId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*, tasks(title, category)')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  const userSessions = Array.from(mockFocusStore.values())
    .filter(s => s.user_id === userId)
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  return userSessions;
}
