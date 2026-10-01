// In-memory mock store for unit testing when Supabase credentials are unconfigured
const mockTaskStore = new Map();

export async function getTasks(supabase, userId, filters = {}) {
  if (supabase) {
    let query = supabase.from('tasks').select('*').eq('user_id', userId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.priority) query = query.eq('priority', filters.priority);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Fallback mock store for standalone unit testing
  let userTasks = Array.from(mockTaskStore.values()).filter(t => t.user_id === userId);
  if (filters.status) userTasks = userTasks.filter(t => t.status === filters.status);
  if (filters.category) userTasks = userTasks.filter(t => t.category === filters.category);
  if (filters.priority) userTasks = userTasks.filter(t => t.priority === filters.priority);
  return userTasks;
}

export async function getTaskById(supabase, userId, taskId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  const task = mockTaskStore.get(taskId);
  if (task && task.user_id === userId) return task;
  return null;
}

export async function createTask(supabase, userId, taskData) {
  const newTask = {
    id: taskData.id || crypto.randomUUID(),
    user_id: userId,
    title: taskData.title,
    description: taskData.description || '',
    category: taskData.category || 'Academic',
    priority: taskData.priority || 'Medium',
    priority_score: taskData.priority_score || 0,
    status: taskData.status || 'pending',
    deadline: taskData.deadline || null,
    estimated_minutes: taskData.estimated_minutes || 0,
    completed_at: taskData.status === 'completed' ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  mockTaskStore.set(newTask.id, newTask);
  return newTask;
}

export async function updateTask(supabase, userId, taskId, updates) {
  const existing = await getTaskById(supabase, userId, taskId);
  if (!existing) return null;

  const updatedData = {
    ...existing,
    ...updates,
    user_id: userId, // Ensure ownership is immutable
    id: taskId,
  };

  if (updates.status === 'completed' && existing.status !== 'completed') {
    updatedData.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== 'completed') {
    updatedData.completed_at = null;
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updatedData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  mockTaskStore.set(taskId, updatedData);
  return updatedData;
}

export async function deleteTask(supabase, userId, taskId) {
  const existing = await getTaskById(supabase, userId, taskId);
  if (!existing) return false;

  if (supabase) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  mockTaskStore.delete(taskId);
  return true;
}
