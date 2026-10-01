const mockGoalStore = new Map();

export async function getGoals(supabase, userId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  return Array.from(mockGoalStore.values()).filter(g => g.user_id === userId);
}

export async function createGoal(supabase, userId, goalData) {
  const newGoal = {
    id: goalData.id || crypto.randomUUID(),
    user_id: userId,
    title: goalData.title,
    description: goalData.description || '',
    target_date: goalData.target_date || null,
    progress: Math.min(100, Math.max(0, Number(goalData.progress) || 0)),
    status: goalData.status || 'active',
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('goals')
      .insert(newGoal)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  mockGoalStore.set(newGoal.id, newGoal);
  return newGoal;
}

export async function updateGoal(supabase, userId, goalId, updates) {
  if (supabase) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const existing = mockGoalStore.get(goalId);
  if (!existing || existing.user_id !== userId) return null;

  const updated = { ...existing, ...updates };
  mockGoalStore.set(goalId, updated);
  return updated;
}

export async function deleteGoal(supabase, userId, goalId) {
  if (supabase) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  const existing = mockGoalStore.get(goalId);
  if (!existing || existing.user_id !== userId) return false;
  mockGoalStore.delete(goalId);
  return true;
}
