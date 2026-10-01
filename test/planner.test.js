import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateSmartDayPlan } from '../backend/services/planner.service.js';

describe('Smart Day Planner Schedule Generator', () => {
  const sampleTasks = [
    {
      id: 'task-low',
      title: 'Read Article',
      category: 'Personal',
      priority: 'Low',
      deadline: '2026-10-15T12:00:00Z',
      estimated_minutes: 60,
      status: 'pending',
    },
    {
      id: 'task-critical',
      title: 'DBMS Assignment',
      category: 'Academic',
      priority: 'Critical',
      deadline: '2026-10-02T12:00:00Z',
      estimated_minutes: 120,
      status: 'pending',
    },
  ];

  test('Planner schedules tasks in priority order within available capacity', () => {
    const plan = generateSmartDayPlan(sampleTasks, {
      availableMinutes: 180,
      startHour: 9,
      planDate: '2026-10-01',
    });

    assert.strictEqual(plan.availableMinutes, 180);
    assert.ok(plan.plannedMinutes <= 180);
    assert.strictEqual(plan.items[0].title, 'DBMS Assignment');
  });

  test('Zero available time returns empty schedule with warning', () => {
    const plan = generateSmartDayPlan(sampleTasks, {
      availableMinutes: 0,
      startHour: 9,
      planDate: '2026-10-01',
    });

    assert.strictEqual(plan.plannedMinutes, 0);
    assert.strictEqual(plan.items.length, 0);
  });

  test('Empty task list returns 0 scheduled items cleanly', () => {
    const plan = generateSmartDayPlan([], {
      availableMinutes: 240,
      startHour: 9,
      planDate: '2026-10-01',
    });

    assert.strictEqual(plan.plannedMinutes, 0);
    assert.strictEqual(plan.items.length, 0);
  });
});
