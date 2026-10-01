import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createTask, listTasks } from '../backend/controllers/task.controller.js';

describe('Task Management API', () => {
  const mockUserId = 'usr-test-123';

  test('Create task with missing title fails validation', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: { description: 'No title' }, user: { id: mockUserId }, supabase: null };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      },
    };

    await createTask(req, res, () => {});

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.success, false);
    assert.strictEqual(jsonResult.error.code, 'VALIDATION_ERROR');
  });

  test('Create task with invalid category fails validation', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: { title: 'DBMS Assignment', category: 'InvalidCategory' }, user: { id: mockUserId }, supabase: null };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      },
    };

    await createTask(req, res, () => {});

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.success, false);
  });

  test('Create task with valid data succeeds', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = {
      body: {
        title: 'DBMS Assignment',
        category: 'Academic',
        priority: 'High',
        estimated_minutes: 120,
      },
      user: { id: mockUserId },
      supabase: null,
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      },
    };

    await createTask(req, res, () => {});

    assert.strictEqual(statusCode, 201);
    assert.strictEqual(jsonResult.success, true);
    assert.strictEqual(jsonResult.data.task.title, 'DBMS Assignment');
  });

  test('List tasks returns user task records', async () => {
    let jsonResult = null;

    const req = { query: {}, user: { id: mockUserId }, supabase: null };
    const res = {
      json(data) {
        jsonResult = data;
        return this;
      },
    };

    await listTasks(req, res, () => {});

    assert.strictEqual(jsonResult.success, true);
    assert.ok(Array.isArray(jsonResult.data.tasks));
  });
});
