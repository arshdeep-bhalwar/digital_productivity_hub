import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculatePriorityScore } from '../backend/services/priority.service.js';
import { calculateDeadlineRisk } from '../backend/services/risk.service.js';

describe('Priority & Deadline Risk Rule Engines', () => {
  const now = new Date('2026-10-01T12:00:00Z');

  describe('Priority Engine', () => {
    test('Completed task returns priority score 0 and level Low', () => {
      const task = { status: 'completed', priority: 'High' };
      const res = calculatePriorityScore(task, now);
      assert.strictEqual(res.score, 0);
      assert.strictEqual(res.level, 'Low');
    });

    test('Near deadline + Critical importance yields High/Critical priority level', () => {
      const task = {
        status: 'pending',
        priority: 'Critical',
        deadline: '2026-10-01T18:00:00Z',
        estimated_minutes: 180,
      };
      const res = calculatePriorityScore(task, now);
      assert.ok(res.score >= 70);
      assert.ok(['High', 'Critical'].includes(res.level));
    });

    test('Far deadline + Low priority yields Low level', () => {
      const task = {
        status: 'pending',
        priority: 'Low',
        deadline: '2026-10-20T12:00:00Z',
        estimated_minutes: 30,
      };
      const res = calculatePriorityScore(task, now);
      assert.strictEqual(res.level, 'Low');
    });
  });

  describe('Deadline Risk Engine', () => {
    test('Completed task returns Low risk', () => {
      const task = { status: 'completed', deadline: '2026-10-02T12:00:00Z' };
      const res = calculateDeadlineRisk(task, 240, now);
      assert.strictEqual(res.level, 'Low');
    });

    test('No deadline returns Low risk with explanation', () => {
      const task = { status: 'pending', estimated_minutes: 120 };
      const res = calculateDeadlineRisk(task, 240, now);
      assert.strictEqual(res.level, 'Low');
    });

    test('Overdue task returns Critical risk', () => {
      const task = {
        status: 'pending',
        deadline: '2026-09-30T12:00:00Z',
        estimated_minutes: 60,
      };
      const res = calculateDeadlineRisk(task, 240, now);
      assert.strictEqual(res.level, 'Critical');
    });

    test('Work remaining > available capacity returns High/Critical risk with explanation', () => {
      const task = {
        status: 'pending',
        deadline: '2026-10-02T12:00:00Z',
        estimated_minutes: 480,
      };
      const res = calculateDeadlineRisk(task, 240, now);
      assert.ok(['High', 'Critical'].includes(res.level));
    });
  });
});
