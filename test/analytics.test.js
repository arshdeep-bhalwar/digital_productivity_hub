import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getDashboardAnalytics, getProductivityDNA } from '../backend/services/analytics.service.js';
import { createTask, updateTask } from '../backend/services/task.service.js';
import { completeFocusSession } from '../backend/services/focus.service.js';

describe('Analytics & Productivity DNA Engine', () => {
  const userId = 'usr-m9-test';

  test('Empty activity data returns honest empty state message', async () => {
    const data = await getDashboardAnalytics(null, userId);
    assert.strictEqual(data.hasSufficientData, false);
    assert.ok(data.emptyMessage.includes('Not enough activity yet'));

    const dna = await getProductivityDNA(null, userId);
    assert.strictEqual(dna.hasSufficientData, false);
  });

  test('Calculates productivity score and observable behavior DNA summary from activity data', async () => {
    const task = await createTask(null, userId, {
      title: 'DBMS Project',
      category: 'Academic',
      priority: 'High',
    });
    await updateTask(null, userId, task.id, { status: 'completed' });

    await completeFocusSession(null, userId, {
      sessionId: 'sess-m9-1',
      durationMinutes: 45,
      completed: true,
    });

    const data = await getDashboardAnalytics(null, userId);
    assert.strictEqual(data.hasSufficientData, true);
    assert.ok(data.productivityScore > 0);

    const dna = await getProductivityDNA(null, userId);
    assert.strictEqual(dna.hasSufficientData, true);
    assert.ok(dna.traits.observableSummary.includes('completed 1 tasks'));
  });
});
