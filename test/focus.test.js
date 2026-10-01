import { test, describe } from 'node:test';
import assert from 'node:assert';
import { startFocusSession, completeFocusSession, getFocusHistory } from '../backend/services/focus.service.js';

describe('Focus Mode Session & Persistence', () => {
  const userId = 'usr-focus-test';

  test('Start session initializes a new focus session record', async () => {
    const session = await startFocusSession(null, userId, 'task-123');
    assert.ok(session.id);
    assert.strictEqual(session.user_id, userId);
    assert.strictEqual(session.completed, false);
  });

  test('Session completed with 0 duration is marked incomplete', async () => {
    const session = await completeFocusSession(null, userId, {
      sessionId: 'sess-001',
      durationMinutes: 0,
      completed: true,
    });
    assert.strictEqual(session.completed, false);
  });

  test('Session with valid focus minutes is recorded as completed', async () => {
    const session = await completeFocusSession(null, userId, {
      sessionId: 'sess-002',
      durationMinutes: 25,
      completed: true,
    });
    assert.strictEqual(session.completed, true);
    assert.strictEqual(session.duration_minutes, 25);
  });

  test('getFocusHistory returns chronological focus history logs', async () => {
    const history = await getFocusHistory(null, userId);
    assert.ok(Array.isArray(history));
  });
});
