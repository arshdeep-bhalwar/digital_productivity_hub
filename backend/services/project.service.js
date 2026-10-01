const mockProjectStore = new Map();
const mockSubtaskStore = new Map();

export async function getProjects(supabase, userId) {
  if (supabase) {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*, subtasks(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return projects || [];
  }

  const userProjects = Array.from(mockProjectStore.values())
    .filter(p => p.user_id === userId)
    .map(p => {
      const subtasks = Array.from(mockSubtaskStore.values()).filter(st => st.project_id === p.id);
      return { ...p, subtasks };
    });
  return userProjects;
}

export async function getProjectById(supabase, userId, projectId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, subtasks(*)')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  const project = mockProjectStore.get(projectId);
  if (project && project.user_id === userId) {
    const subtasks = Array.from(mockSubtaskStore.values()).filter(st => st.project_id === projectId);
    return { ...project, subtasks };
  }
  return null;
}

export async function createProject(supabase, userId, projectData) {
  const newProject = {
    id: projectData.id || crypto.randomUUID(),
    user_id: userId,
    name: projectData.name,
    description: projectData.description || '',
    deadline: projectData.deadline || null,
    status: projectData.status || 'Not Started',
    progress: 0,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (error) throw error;

    if (projectData.subtasks && projectData.subtasks.length > 0) {
      const subtaskRecords = projectData.subtasks.map(st => ({
        id: crypto.randomUUID(),
        project_id: data.id,
        title: st.title || st,
        estimated_minutes: Number(st.estimated_minutes) || 30,
        status: 'pending',
      }));

      await supabase.from('subtasks').insert(subtaskRecords);
    }

    return getProjectById(supabase, userId, data.id);
  }

  mockProjectStore.set(newProject.id, newProject);
  if (projectData.subtasks && projectData.subtasks.length > 0) {
    projectData.subtasks.forEach(st => {
      const stId = crypto.randomUUID();
      mockSubtaskStore.set(stId, {
        id: stId,
        project_id: newProject.id,
        title: typeof st === 'string' ? st : st.title,
        estimated_minutes: st.estimated_minutes || 30,
        status: 'pending',
      });
    });
  }

  return getProjectById(supabase, userId, newProject.id);
}

export async function addSubtask(supabase, userId, projectId, subtaskData) {
  const project = await getProjectById(supabase, userId, projectId);
  if (!project) return null;

  const newSubtask = {
    id: crypto.randomUUID(),
    project_id: projectId,
    title: subtaskData.title,
    estimated_minutes: Number(subtaskData.estimated_minutes) || 30,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('subtasks')
      .insert(newSubtask)
      .select()
      .single();

    if (error) throw error;
    await recalculateProjectProgress(supabase, userId, projectId);
    return data;
  }

  mockSubtaskStore.set(newSubtask.id, newSubtask);
  recalculateProjectProgress(null, userId, projectId);
  return newSubtask;
}

export async function completeSubtask(supabase, userId, subtaskId) {
  if (supabase) {
    const { data: subtask, error: fetchErr } = await supabase
      .from('subtasks')
      .select('*, projects!inner(user_id)')
      .eq('id', subtaskId)
      .single();

    if (fetchErr || !subtask || subtask.projects.user_id !== userId) return null;

    const { data: updated, error } = await supabase
      .from('subtasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', subtaskId)
      .select()
      .single();

    if (error) throw error;
    await recalculateProjectProgress(supabase, userId, subtask.project_id);
    return updated;
  }

  const subtask = mockSubtaskStore.get(subtaskId);
  if (!subtask) return null;
  const project = mockProjectStore.get(subtask.project_id);
  if (!project || project.user_id !== userId) return null;

  const updated = {
    ...subtask,
    status: 'completed',
    completed_at: new Date().toISOString(),
  };
  mockSubtaskStore.set(subtaskId, updated);
  recalculateProjectProgress(null, userId, subtask.project_id);
  return updated;
}

export async function recalculateProjectProgress(supabase, userId, projectId) {
  let subtasks = [];
  if (supabase) {
    const { data } = await supabase.from('subtasks').select('*').eq('project_id', projectId);
    subtasks = data || [];
  } else {
    subtasks = Array.from(mockSubtaskStore.values()).filter(st => st.project_id === projectId);
  }

  if (subtasks.length === 0) return 0;

  const completedCount = subtasks.filter(st => st.status === 'completed').length;
  const progress = Math.round((completedCount / subtasks.length) * 100);
  const status = progress === 100 ? 'Completed' : (completedCount > 0 ? 'In Progress' : 'Not Started');

  if (supabase) {
    await supabase.from('projects').update({ progress, status }).eq('id', projectId).eq('user_id', userId);
  } else {
    const proj = mockProjectStore.get(projectId);
    if (proj) {
      mockProjectStore.set(projectId, { ...proj, progress, status });
    }
  }

  return progress;
}

export async function deleteProject(supabase, userId, projectId) {
  const existing = await getProjectById(supabase, userId, projectId);
  if (!existing) return false;

  if (supabase) {
    const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('user_id', userId);
    if (error) throw error;
    return true;
  }

  mockProjectStore.delete(projectId);
  return true;
}
