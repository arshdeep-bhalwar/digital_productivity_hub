import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseAndValidateBrainDumpOutput } from '../backend/services/gemini.service.js';
import { handleBrainDump } from '../backend/controllers/ai.controller.js';

describe('Brain Dump AI Extraction & Schema Parsing', () => {
  test('Valid raw JSON output parses and normalizes correctly', () => {
    const raw = JSON.stringify({
      tasks: [
        {
          title: 'DBMS Assignment',
          category: 'Academic',
          priority: 'High',
          deadline: '2026-10-02',
          estimated_minutes: 120,
        },
      ],
    });

    const tasks = parseAndValidateBrainDumpOutput(raw);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].title, 'DBMS Assignment');
  });

  test('Markdown-wrapped JSON output parses cleanly', () => {
    const raw = '```json\n{"tasks":[{"title":"Java Viva","category":"Academic","priority":"Medium","estimated_minutes":60}]}\n```';
    const tasks = parseAndValidateBrainDumpOutput(raw);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].title, 'Java Viva');
  });

  test('Malformed JSON string throws AI_PARSE_ERROR', () => {
    assert.throws(
      () => parseAndValidateBrainDumpOutput('Not a json response'),
      (err) => err.code === 'AI_PARSE_ERROR'
    );
  });

  test('Missing tasks array throws AI_SCHEMA_ERROR', () => {
    assert.throws(
      () => parseAndValidateBrainDumpOutput('{"data": "invalid"}'),
      (err) => err.code === 'AI_SCHEMA_ERROR'
    );
  });

  test('Brain Dump controller handles AI service failure gracefully with 503', async () => {
    let statusCode = 0;
    let jsonResult = null;

    const req = {
      body: { text: 'Study for DBMS' },
      user: { id: 'usr-test' },
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

    await handleBrainDump(req, res, () => {});

    assert.strictEqual(statusCode, 503);
    assert.strictEqual(jsonResult.success, false);
  });
});
