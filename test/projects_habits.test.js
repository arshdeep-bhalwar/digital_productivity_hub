import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createProject, completeSubtask, getProjectById } from '../backend/services/project.service.js';
import { calculateStreak } from '../backend/services/habit.service.js';
import { createGoal, getGoals } from '../backend/services/goal.service.js';

describe('Projects, Subtasks, Goals & Habit Streaks', () => {
  const userId = 'usr-m8-test';

  describe('Projects & Subtask Progress Engine', () => {
    test('Completing subtasks dynamically recalculates project completion percentage', async () => {
      const project = await createProject(null, userId, {
        name: 'Portfolio Website',
        subtasks: ['Setup Repository', 'Design Theme'],
      });

      assert.strictEqual(project.progress, 0);

      const firstSubtaskId = project.subtasks[0].id;
      await completeSubtask(null, userId, firstSubtaskId);

      const updatedProj = await getProjectById(null, userId, project.id);
      assert.strictEqual(updatedProj.progress, 50);

      const secondSubtaskId = project.subtasks[1].id;
      await completeSubtask(null, userId, secondSubtaskId);

      const finalProj = await getProjectById(null, userId, project.id);
      assert.strictEqual(finalProj.progress, 100);
    });
  });

  describe('Habit Streak Engine', () => {
    test('Streak increments on consecutive daily completion logs', () => {
      const logs = [
        { date: '2026-10-01', completed: true },
        { date: '2026-09-30', completed: true },
        { date: '2026-09-29', completed: true },
      ];

      const streak = calculateStreak(logs, '2026-10-01');
      assert.strictEqual(streak, 3);
    });

    test('Missed day resets streak calculation', () => {
      const logs = [
        { date: '2026-09-28', completed: true },
      ];

      const streak = calculateStreak(logs, '2026-10-01');
      assert.strictEqual(streak, 0);
    });
  });

  describe('Goals Tracker', () => {
    test('Create and retrieve active goals', async () => {
      const goal = await createGoal(null, userId, {
        title: 'Master Fullstack Development',
        progress: 40,
      });

      assert.ok(goal.id);
      const goals = await getGoals(null, userId);
      assert.ok(goals.length >= 1);
    });
  });
});
