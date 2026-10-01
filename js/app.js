import { request, getStoredUser, setStoredSession, clearStoredSession } from './api.js';

// Application state
let state = {
  tasks: [],
  plannerItems: [],
  focusTimerMins: 25,
  focusTimerSecs: 0,
  focusTimerActive: false,
  focusTimerInterval: null,
  focusSessionId: null,
  focusStartTime: null,
  brainDumpCandidates: [],
};

function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function renderAuthErrorCard(container, msg) {
  if (msg.includes('Authentication') || msg.includes('token') || msg.includes('UNAUTHORIZED')) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 2rem; border-color: rgba(0, 212, 255, 0.3); margin: 2rem auto; width: 100%; max-width: 580px; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
        <h4 style="color: var(--snow); font-size: 1.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <i data-lucide="lock"></i> Account Sign In Required
        </h4>
        <p style="color: rgba(232, 244, 248, 0.75); margin-bottom: 1.5rem; font-size: 0.95rem; line-height: 1.6;">
          Sign in or create a free student account to view and save your workload directly to the cloud database.
        </p>
        <button class="btn btn-primary" onclick="document.getElementById('modal-auth').classList.add('active')" style="padding: 0.75rem 1.75rem; font-size: 0.95rem;">
          <i data-lucide="user-check"></i> Sign In / Register
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `<div style="grid-column: 1 / -1; color: var(--glacier-pink); text-align: center; width: 100%; margin: 2rem auto;">${msg}</div>`;
  }
  renderIcons();
}

// IntersectionObserver for Scroll Reveal & Hide-on-Scroll-Up Animations
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          entry.target.classList.remove('reveal-hidden');
        } else {
          // When scrolled out of viewport, add reveal-hidden class to trigger hide animation
          entry.target.classList.remove('reveal-visible');
          entry.target.classList.add('reveal-hidden');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '-20px 0px -20px 0px'
    }
  );

  document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));

  // Interactive 3D Card Tilt Effect on Mouse Hover
  document.querySelectorAll('.feature-row .card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / (rect.height / 2)) * 12;
      const rotateY = (x / (rect.width / 2)) * 12;
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.03)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  let lastScrollTop = 0;
  // Scroll Direction Detector & Top Aurora Scroll Progress Bar Update
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    if (scrollTop < lastScrollTop) {
      document.body.classList.add('scrolling-up');
    } else {
      document.body.classList.remove('scrolling-up');
    }
    lastScrollTop = Math.max(0, scrollTop);

    const progressBar = document.getElementById('scroll-progress-bar');
    if (!progressBar) return;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight > 0) {
      const progress = (scrollTop / scrollHeight) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    } else {
      progressBar.style.width = '0%';
    }
  });
}

// Global Tab Switcher with Auto Navbar Scroll
window.switchToTab = function (targetId) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.view-section').forEach((v) => v.classList.remove('active'));

  const navBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
  if (navBtn) {
    navBtn.classList.add('active');
    // Smoothly scroll active navbar tab into center view inside navbar container
    navBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    targetEl.classList.add('active');
    onViewChanged(targetId);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Keyboard Arrow & Number Shortcut Tab Switching System
function initKeyboardTabNavigation() {
  const tabs = [
    'view-home',
    'view-brain-dump',
    'view-tasks',
    'view-planner',
    'view-focus',
    'view-projects',
    'view-habits',
    'view-analytics',
    'view-assistant'
  ];

  window.addEventListener('keydown', (e) => {
    // Skip shortcut processing if user is currently typing in input/textarea/editable element
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );
    const isModalOpen = document.querySelector('.modal-overlay.active');
    if (isTyping || isModalOpen) return;

    const activeNavBtn = document.querySelector('.nav-btn.active');
    let currentIndex = 0;
    if (activeNavBtn) {
      const currentTarget = activeNavBtn.getAttribute('data-target');
      currentIndex = tabs.indexOf(currentTarget);
      if (currentIndex === -1) currentIndex = 0;
    }

    // Arrow Right -> Next Tab
    if (e.key === 'ArrowRight' || (e.altKey && e.key === 'ArrowDown')) {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      window.switchToTab(tabs[nextIndex]);
    }

    // Arrow Left -> Previous Tab
    else if (e.key === 'ArrowLeft' || (e.altKey && e.key === 'ArrowUp')) {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      window.switchToTab(tabs[prevIndex]);
    }

    // Numbers 1 through 9 -> Direct Tab Jump
    else if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
      const numIndex = parseInt(e.key, 10) - 1;
      if (numIndex < tabs.length) {
        e.preventDefault();
        window.switchToTab(tabs[numIndex]);
      }
    }
  });

  // Horizontal Mouse Wheel Scroll over Navbar Container
  const headerNav = document.querySelector('.header-nav');
  if (headerNav) {
    headerNav.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        headerNav.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }
}

// UI Navigation switching
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    window.switchToTab(targetId);
  });
});

function onViewChanged(viewId) {
  if (viewId === 'view-tasks') loadTasks();
  if (viewId === 'view-planner') loadPlannerView();
  if (viewId === 'view-projects') loadProjects();
  if (viewId === 'view-habits') loadHabits();
  if (viewId === 'view-analytics') loadAnalytics();
}

// Hero CTA buttons
const heroLaunchBtn = document.getElementById('btn-hero-launch');
if (heroLaunchBtn) {
  heroLaunchBtn.addEventListener('click', () => window.switchToTab('view-brain-dump'));
}

const heroLoginBtn = document.getElementById('btn-hero-login');
if (heroLoginBtn) {
  heroLoginBtn.addEventListener('click', () => {
    const user = getStoredUser();
    if (!user) {
      document.getElementById('modal-auth').classList.add('active');
    } else {
      window.switchToTab('view-brain-dump');
    }
  });
}

// User Auth modal & state
const userBadgeDisplay = document.getElementById('user-email-display');
const btnAuthAction = document.getElementById('btn-auth-action');
const modalAuth = document.getElementById('modal-auth');

function updateAuthUI() {
  const user = getStoredUser();
  if (user && user.email) {
    userBadgeDisplay.textContent = user.email;
    btnAuthAction.innerHTML = '<i data-lucide="log-out"></i> Logout';
  } else {
    userBadgeDisplay.textContent = 'Sign In';
    btnAuthAction.innerHTML = '<i data-lucide="user-check"></i> Sign In';
  }
  renderIcons();
}

btnAuthAction.addEventListener('click', () => {
  const user = getStoredUser();
  if (user) {
    clearStoredSession();
    updateAuthUI();
    loadTasks();
  } else {
    modalAuth.classList.add('active');
  }
});

document.getElementById('btn-auth-login').addEventListener('click', async () => {
  const email = document.getElementById('auth-input-email').value;
  const password = document.getElementById('auth-input-password').value;
  const errorMsg = document.getElementById('auth-error-msg');

  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredSession(res.data.session, res.data.user);
    modalAuth.classList.remove('active');
    updateAuthUI();
    window.switchToTab('view-brain-dump');
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove('hidden');
  }
});

document.getElementById('btn-auth-register').addEventListener('click', async () => {
  const email = document.getElementById('auth-input-email').value;
  const password = document.getElementById('auth-input-password').value;
  const errorMsg = document.getElementById('auth-error-msg');

  try {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredSession(res.data.session, res.data.user);
    modalAuth.classList.remove('active');
    updateAuthUI();
    window.switchToTab('view-brain-dump');
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove('hidden');
  }
});

// 1. Brain Dump Gemini Task Extraction
document.getElementById('btn-process-brain-dump').addEventListener('click', async () => {
  const text = document.getElementById('brain-dump-input').value;
  const statusEl = document.getElementById('brain-dump-status');
  const resultsCard = document.getElementById('brain-dump-results');
  const candidateList = document.getElementById('brain-dump-candidate-list');

  if (!text.trim()) {
    statusEl.innerHTML = '<i data-lucide="alert-circle"></i> Please enter task notes or thoughts first.';
    renderIcons();
    return;
  }

  statusEl.innerHTML = '<i data-lucide="loader"></i> Processing with Gemini AI...';
  renderIcons();

  try {
    const res = await request('/ai/brain-dump', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    state.brainDumpCandidates = res.data.tasks || [];
    statusEl.innerHTML = '<i data-lucide="check-circle"></i> Extraction complete!';

    candidateList.innerHTML = state.brainDumpCandidates.map((t, idx) => `
      <div class="task-item">
        <div class="task-item-header">
          <input type="checkbox" checked id="bd-check-${idx}" style="accent-color: var(--aurora-green);">
          <div class="task-title">${t.title}</div>
        </div>
        <div class="task-meta">
          <span class="badge badge-${t.priority.toLowerCase()}">${t.priority} Priority</span>
          <span class="badge badge-low">${t.category}</span>
          <span><i data-lucide="clock"></i> ${t.estimated_minutes} mins</span>
          ${t.deadline ? `<span><i data-lucide="calendar"></i> ${t.deadline}</span>` : ''}
        </div>
      </div>
    `).join('');

    resultsCard.classList.remove('hidden');
    renderIcons();
  } catch (err) {
    statusEl.innerHTML = `<i data-lucide="alert-triangle"></i> ${err.message}`;
    renderIcons();
  }
});

document.getElementById('btn-confirm-brain-dump-tasks').addEventListener('click', async () => {
  const selected = state.brainDumpCandidates.filter((_, idx) => {
    const chk = document.getElementById(`bd-check-${idx}`);
    return chk && chk.checked;
  });

  for (const t of selected) {
    try {
      await request('/tasks', {
        method: 'POST',
        body: JSON.stringify(t),
      });
    } catch (err) {
      console.error('Task save error:', err);
    }
  }

  alert(`Successfully added ${selected.length} tasks to your workload!`);
  document.getElementById('brain-dump-results').classList.add('hidden');
  document.getElementById('brain-dump-input').value = '';
  window.switchToTab('view-tasks');
});

// 2. Task Manager Functions
async function loadTasks() {
  const container = document.getElementById('task-list-container');
  container.innerHTML = '<div style="color: var(--ice-cyan);"><i data-lucide="loader"></i> Loading tasks...</div>';
  renderIcons();

  try {
    const res = await request('/tasks');
    state.tasks = res.data.tasks || [];

    if (state.tasks.length === 0) {
      container.innerHTML = '<div style="color: rgba(232,244,248,0.6); grid-column: 1 / -1; text-align: center; margin: 2rem 0;">No tasks found. Use Brain Dump or click "+ Add New Task" to create one.</div>';
      return;
    }

    container.innerHTML = state.tasks.map(t => `
      <div class="task-item">
        <div>
          <div class="task-item-header">
            <div class="task-title" style="${t.status === 'Completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.title}</div>
            <span class="score-indicator">Score: ${t.priority_score || 0}</span>
          </div>
          <div class="task-meta">
            <span class="badge badge-${(t.priority || 'medium').toLowerCase()}">${t.priority}</span>
            <span class="badge badge-low">${t.category || 'General'}</span>
            ${t.deadline_risk ? `<span class="badge badge-${t.deadline_risk.toLowerCase()}">Risk: ${t.deadline_risk}</span>` : ''}
            <span><i data-lucide="clock"></i> ${t.estimated_minutes || 30} mins</span>
          </div>
        </div>
        <div class="flex-between mt-2">
          ${t.status !== 'Completed' ? `<button class="btn btn-primary" onclick="completeTask('${t.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;"><i data-lucide="check"></i> Done</button>` : '<span style="font-size:0.75rem; color:var(--aurora-green);"><i data-lucide="check-circle-2"></i> Completed</span>'}
          <button class="btn btn-danger" onclick="deleteTask('${t.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;"><i data-lucide="trash-2"></i> Delete</button>
        </div>
      </div>
    `).join('');
    renderIcons();
  } catch (err) {
    renderAuthErrorCard(container, err.message);
  }
}

window.completeTask = async function (id) {
  try {
    await request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Completed' }),
    });
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
};

window.deleteTask = async function (id) {
  try {
    await request(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
};

// Task modal controls
const modalCreateTask = document.getElementById('modal-create-task');
document.getElementById('btn-open-create-task').addEventListener('click', () => modalCreateTask.classList.add('active'));
document.getElementById('btn-close-create-task').addEventListener('click', () => modalCreateTask.classList.remove('active'));

document.getElementById('btn-save-task').addEventListener('click', async () => {
  const title = document.getElementById('task-input-title').value;
  const category = document.getElementById('task-input-category').value;
  const priority = document.getElementById('task-input-priority').value;
  const deadline = document.getElementById('task-input-deadline').value || null;
  const estimated_minutes = Number(document.getElementById('task-input-estimated').value) || 30;

  if (!title.trim()) {
    alert('Task title is required.');
    return;
  }

  try {
    await request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, category, priority, deadline, estimated_minutes }),
    });
    modalCreateTask.classList.remove('active');
    document.getElementById('task-input-title').value = '';
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
});

// 3. Smart Day Planner
document.getElementById('btn-generate-plan').addEventListener('click', async () => {
  const mins = Number(document.getElementById('planner-available-mins').value) || 240;
  const container = document.getElementById('planner-timeline');

  try {
    const res = await request('/planner/generate', {
      method: 'POST',
      body: JSON.stringify({ available_minutes: mins }),
    });

    const plan = res.data.plan;
    container.innerHTML = `
      <div style="margin-bottom: 1rem; color: var(--aurora-green); font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
        <i data-lucide="clock"></i> Planned Minutes: ${plan.planned_minutes} / ${plan.available_minutes} mins (${plan.schedule.length} items scheduled)
      </div>
      <div style="display: grid; gap: 0.75rem;">
        ${plan.schedule.map((item) => `
          <div style="background: rgba(5,11,26,0.7); border: 1px solid var(--surface-border); border-left: 4px solid ${item.type === 'break' ? 'var(--ice-cyan)' : 'var(--aurora-green)'}; padding: 0.85rem 1.25rem; border-radius: var(--radius-md); display: flex; justify-content: space-between;">
            <div>
              <span style="font-family: var(--font-mono); font-weight: 700; color: var(--snow);">${item.start_time} - ${item.end_time}</span>
              <span style="margin-left: 1rem; font-weight: 600;">${item.title}</span>
            </div>
            <span class="badge ${item.type === 'break' ? 'badge-medium' : 'badge-low'}">${item.type}</span>
          </div>
        `).join('')}
      </div>
    `;
    renderIcons();
  } catch (err) {
    renderAuthErrorCard(container, err.message);
  }
});

function loadPlannerView() {
  document.getElementById('btn-generate-plan').click();
}

// 4. Focus Timer Logic
const timerDisplay = document.getElementById('focus-timer-display');
const btnStart = document.getElementById('btn-timer-start');
const btnPause = document.getElementById('btn-timer-pause');
const btnReset = document.getElementById('btn-timer-reset');
const btnComplete = document.getElementById('btn-timer-complete');

function renderTimer() {
  const m = String(state.focusTimerMins).padStart(2, '0');
  const s = String(state.focusTimerSecs).padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

btnStart.addEventListener('click', async () => {
  state.focusTimerActive = true;
  btnStart.classList.add('hidden');
  btnPause.classList.remove('hidden');

  if (!state.focusStartTime) state.focusStartTime = new Date().toISOString();

  state.focusTimerInterval = setInterval(() => {
    if (state.focusTimerSecs === 0) {
      if (state.focusTimerMins === 0) {
        clearInterval(state.focusTimerInterval);
        btnComplete.click();
        return;
      }
      state.focusTimerMins--;
      state.focusTimerSecs = 59;
    } else {
      state.focusTimerSecs--;
    }
    renderTimer();
  }, 1000);
});

btnPause.addEventListener('click', () => {
  state.focusTimerActive = false;
  clearInterval(state.focusTimerInterval);
  btnPause.classList.add('hidden');
  btnStart.classList.remove('hidden');
});

btnReset.addEventListener('click', () => {
  state.focusTimerActive = false;
  clearInterval(state.focusTimerInterval);
  state.focusTimerMins = 25;
  state.focusTimerSecs = 0;
  state.focusStartTime = null;
  btnPause.classList.add('hidden');
  btnStart.classList.remove('hidden');
  renderTimer();
});

btnComplete.addEventListener('click', async () => {
  state.focusTimerActive = false;
  clearInterval(state.focusTimerInterval);

  const elapsedMins = 25 - state.focusTimerMins;

  try {
    await request('/focus/complete', {
      method: 'POST',
      body: JSON.stringify({
        session_id: state.focusSessionId || undefined,
        actual_minutes: Math.max(1, elapsedMins),
      }),
    });
    alert('Focus session recorded successfully!');
    btnReset.click();
    loadFocusHistory();
  } catch (err) {
    alert(err.message);
  }
});

async function loadFocusHistory() {
  const historyList = document.getElementById('focus-history-list');
  try {
    const res = await request('/focus/history');
    const sessions = res.data.sessions || [];
    if (sessions.length === 0) {
      historyList.innerHTML = '<div>No focus session records yet.</div>';
      return;
    }
    historyList.innerHTML = sessions.slice(0, 5).map(s => `
      <div style="display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <span><i data-lucide="clock" style="width:14px; height:14px;"></i> ${new Date(s.start_time).toLocaleString()}</span>
        <span style="color: var(--aurora-green); font-weight:600;">${s.actual_minutes} mins</span>
      </div>
    `).join('');
    renderIcons();
  } catch (err) {
    historyList.innerHTML = `<div>${err.message}</div>`;
  }
}

// 5. Projects & Goals
async function loadProjects() {
  const container = document.getElementById('projects-container');
  try {
    const res = await request('/projects');
    const projects = res.data.projects || [];
    if (projects.length === 0) {
      container.innerHTML = '<div style="color: rgba(232,244,248,0.6); grid-column: 1 / -1; text-align: center; margin: 2rem 0;">No projects active. Create projects via API or assistant.</div>';
      return;
    }

    container.innerHTML = projects.map(p => `
      <div class="card" style="margin: 0;">
        <div class="flex-between">
          <h3 style="color: var(--snow); display:flex; align-items:center; gap:0.4rem;"><i data-lucide="folder-kanban"></i> ${p.name}</h3>
          <span class="badge badge-medium">${p.progress || 0}% Complete</span>
        </div>
        <p style="font-size: 0.85rem; color: rgba(232,244,248,0.7); margin: 0.5rem 0;">${p.description || ''}</p>
        <div style="background: rgba(5,11,26,0.8); height: 8px; border-radius: 4px; overflow: hidden; margin: 0.75rem 0;">
          <div style="width: ${p.progress || 0}%; background: linear-gradient(90deg, var(--aurora-green), var(--ice-cyan)); height: 100%;"></div>
        </div>
      </div>
    `).join('');
    renderIcons();
  } catch (err) {
    renderAuthErrorCard(container, err.message);
  }
}

// 6. Habits
async function loadHabits() {
  const container = document.getElementById('habits-container');
  try {
    const res = await request('/habits');
    const habits = res.data.habits || [];
    if (habits.length === 0) {
      container.innerHTML = '<div style="color: rgba(232,244,248,0.6); grid-column: 1 / -1; text-align: center; margin: 2rem 0;">No habits set up yet.</div>';
      return;
    }
    container.innerHTML = habits.map(h => `
      <div class="task-item">
        <div>
          <div class="task-title">${h.title}</div>
          <div class="task-meta">
            <span class="badge badge-low"><i data-lucide="flame" style="width:14px; height:14px;"></i> Streak: ${h.streak || 0} days</span>
          </div>
        </div>
        <button class="btn btn-primary mt-2" onclick="logHabit('${h.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;"><i data-lucide="check"></i> Log Today</button>
      </div>
    `).join('');
    renderIcons();
  } catch (err) {
    renderAuthErrorCard(container, err.message);
  }
}

window.logHabit = async function (id) {
  try {
    await request(`/habits/${id}/log`, { method: 'POST' });
    alert('Habit completion logged!');
    loadHabits();
  } catch (err) {
    alert(err.message);
  }
};

// 7. Analytics & DNA
async function loadAnalytics() {
  try {
    const res = await request('/analytics/dashboard');
    const d = res.data;
    document.getElementById('stat-productivity-score').textContent = d.productivity_score ? `${d.productivity_score}/100` : '--';
    document.getElementById('stat-completed-tasks').textContent = d.completed_tasks || 0;
    document.getElementById('stat-focus-hours').textContent = `${((d.focus_minutes || 0) / 60).toFixed(1)}h`;
    document.getElementById('stat-habit-streak').textContent = `${d.active_streak || 0} days`;

    const dnaRes = await request('/analytics/productivity-dna');
    document.getElementById('dna-summary-text').textContent = dnaRes.data.dna?.summary || dnaRes.message;
    renderIcons();
  } catch (err) {
    console.error('Analytics error:', err);
  }
}

// 8. AI Assistant
document.getElementById('btn-ask-assistant').addEventListener('click', async () => {
  const question = document.getElementById('assistant-question-input').value;
  const answerBox = document.getElementById('assistant-answer-box');
  const answerText = document.getElementById('assistant-answer-text');

  if (!question.trim()) return;

  answerText.innerHTML = '<i data-lucide="loader"></i> Thinking...';
  answerBox.classList.remove('hidden');
  renderIcons();

  try {
    const res = await request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
    answerText.textContent = res.data.answer;
  } catch (err) {
    answerText.textContent = `Error: ${err.message}`;
  }
});

document.getElementById('btn-generate-study-plan').addEventListener('click', async () => {
  const subject = document.getElementById('study-subject-input').value;
  const examDate = document.getElementById('study-exam-date-input').value;
  const planBox = document.getElementById('study-plan-box');
  const listEl = document.getElementById('study-blocks-list');

  if (!subject.trim()) return;

  listEl.innerHTML = '<i data-lucide="loader"></i> Generating study blocks...';
  planBox.classList.remove('hidden');
  renderIcons();

  try {
    const res = await request('/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify({ subject, examDate }),
    });
    const blocks = res.data.study_blocks || [];
    listEl.innerHTML = blocks.map(b => `
      <div style="padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <strong>${b.topic}</strong> (${b.duration_minutes} mins)<br>
        <span style="color: rgba(232,244,248,0.7);">${b.recommendation || ''}</span>
      </div>
    `).join('');
    renderIcons();
  } catch (err) {
    listEl.textContent = `Error: ${err.message}`;
  }
});

// Initial boot
updateAuthUI();
initScrollReveal();
initKeyboardTabNavigation();
renderIcons();
