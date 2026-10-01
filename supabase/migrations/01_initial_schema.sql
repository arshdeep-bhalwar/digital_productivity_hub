-- Enable pgcrypto for gen_random_uuid if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('Academic', 'Project', 'Career', 'Personal', 'Health', 'Other')) DEFAULT 'Academic',
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    priority_score INTEGER DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    deadline TIMESTAMPTZ,
    estimated_minutes INTEGER DEFAULT 0 CHECK (estimated_minutes >= 0),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    status TEXT CHECK (status IN ('Not Started', 'In Progress', 'On Hold', 'Completed')) DEFAULT 'Not Started',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. SUBTASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    estimated_minutes INTEGER DEFAULT 0 CHECK (estimated_minutes >= 0),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. FOCUS SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0 CHECK (duration_minutes >= 0),
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. GOALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. HABITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly')) DEFAULT 'daily',
    streak INTEGER DEFAULT 0 CHECK (streak >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. HABIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT habit_logs_habit_date_unique UNIQUE (habit_id, date)
);

-- ============================================================================
-- 9. DAILY PLANS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    available_minutes INTEGER DEFAULT 0 CHECK (available_minutes >= 0),
    planned_minutes INTEGER DEFAULT 0 CHECK (planned_minutes >= 0),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT daily_plans_user_date_unique UNIQUE (user_id, plan_date)
);

-- ============================================================================
-- 10. PLAN ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_plan_id UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_subtasks_project_id ON public.subtasks(project_id);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON public.focus_sessions(task_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_id ON public.daily_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON public.daily_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_plan_items_daily_plan ON public.plan_items(daily_plan_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Tasks Policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Subtasks Policies
CREATE POLICY "Users can view subtasks of own projects" ON public.subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.subtasks.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert subtasks into own projects" ON public.subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.subtasks.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update subtasks of own projects" ON public.subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.subtasks.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete subtasks of own projects" ON public.subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.subtasks.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- Focus Sessions Policies
CREATE POLICY "Users can view own focus sessions" ON public.focus_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions" ON public.focus_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions" ON public.focus_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions" ON public.focus_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Habits Policies
CREATE POLICY "Users can view own habits" ON public.habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
    FOR DELETE USING (auth.uid() = user_id);

-- Habit Logs Policies
CREATE POLICY "Users can view logs of own habits" ON public.habit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.habits
            WHERE public.habits.id = public.habit_logs.habit_id
            AND public.habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for own habits" ON public.habit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.habits
            WHERE public.habits.id = public.habit_logs.habit_id
            AND public.habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update logs of own habits" ON public.habit_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.habits
            WHERE public.habits.id = public.habit_logs.habit_id
            AND public.habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete logs of own habits" ON public.habit_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.habits
            WHERE public.habits.id = public.habit_logs.habit_id
            AND public.habits.user_id = auth.uid()
        )
    );

-- Daily Plans Policies
CREATE POLICY "Users can view own daily plans" ON public.daily_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily plans" ON public.daily_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily plans" ON public.daily_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily plans" ON public.daily_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Plan Items Policies
CREATE POLICY "Users can view plan items of own daily plans" ON public.plan_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.daily_plans
            WHERE public.daily_plans.id = public.plan_items.daily_plan_id
            AND public.daily_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert plan items into own daily plans" ON public.plan_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_plans
            WHERE public.daily_plans.id = public.plan_items.daily_plan_id
            AND public.daily_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update plan items of own daily plans" ON public.plan_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.daily_plans
            WHERE public.daily_plans.id = public.plan_items.daily_plan_id
            AND public.daily_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete plan items of own daily plans" ON public.plan_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.daily_plans
            WHERE public.daily_plans.id = public.plan_items.daily_plan_id
            AND public.daily_plans.user_id = auth.uid()
        )
    );

-- ============================================================================
-- AUTH USER TRIGGER FOR PROFILE CREATION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
