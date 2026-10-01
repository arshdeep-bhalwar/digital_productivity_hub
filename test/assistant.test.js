import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  handleAskAssistant,
  handleProjectBreakdown,
  handleStudyPlan,
} from '../backend/controllers/ai.controller.js';

describe('Gemini Generative Assistant Endpoints', () => {
  test('Ask assistant fails validation when question is missing', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: {}, user: { id: 'usr-1' } };
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

    await handleAskAssistant(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.error.code, 'VALIDATION_ERROR');
  });

  test('Project breakdown fails validation when project name is missing', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: { description: 'Project desc' }, user: { id: 'usr-1' } };
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

    await handleProjectBreakdown(req, res, () => {});
    assert.strictEqual(statusCode, 400);
  });

  test('Study plan fails validation when subject is missing', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: { examDate: '2026-10-15' }, user: { id: 'usr-1' } };
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

    await handleStudyPlan(req, res, () => {});
    assert.strictEqual(statusCode, 400);
  });

  test('Gracefully handles API errors with 503 fallback response', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = { body: { question: 'How to prioritize tasks?' }, user: { id: 'usr-1' } };
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

    await handleAskAssistant(req, res, () => {});
    assert.strictEqual(statusCode, 503);
    assert.strictEqual(jsonResult.success, false);
  });
});
