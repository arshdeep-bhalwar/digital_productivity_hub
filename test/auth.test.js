import { test, describe } from 'node:test';
import assert from 'node:assert';
import { register, login, me } from '../backend/controllers/auth.controller.js';

describe('Authentication & User Management', () => {
  test('Register validation fails when email or password is missing', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: { email: '' } };
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

    await register(req, res, () => {});

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.success, false);
    assert.strictEqual(jsonResult.error.code, 'VALIDATION_ERROR');
  });

  test('Register validation fails for short passwords', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: { email: 'test@example.com', password: '123' } };
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

    await register(req, res, () => {});

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.success, false);
    assert.ok(jsonResult.error.message.includes('6 characters'));
  });

  test('Login validation fails when credentials are missing', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: {} };
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

    await login(req, res, () => {});

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.success, false);
  });

  test('User profile endpoint returns authenticated user identity', async () => {
    let jsonResult = null;

    const req = {
      user: { id: 'usr-123', email: 'arjun@student.edu', user_metadata: { name: 'Arjun' } },
      supabase: null,
    };
    const res = {
      status() { return this; },
      json(data) {
        jsonResult = data;
        return this;
      },
    };

    await me(req, res, () => {});

    assert.strictEqual(jsonResult.success, true);
    assert.strictEqual(jsonResult.data.profile.name, 'Arjun');
  });
});
