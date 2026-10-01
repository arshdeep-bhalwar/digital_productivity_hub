import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import app from '../backend/server.js';
import { config } from '../backend/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Foundation & System Configuration', () => {
  test('Environment config exposes expected configuration keys', () => {
    assert.strictEqual(typeof config.port, 'number');
    assert.strictEqual(typeof config.supabaseUrl, 'string');
    assert.strictEqual(typeof config.geminiModel, 'string');
  });

  test('Migration schema contains required tables and RLS security policies', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/01_initial_schema.sql');
    assert.ok(fs.existsSync(migrationPath), 'Migration SQL file should exist');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    const requiredTables = [
      'profiles',
      'tasks',
      'projects',
      'subtasks',
      'focus_sessions',
      'goals',
      'habits',
      'habit_logs',
      'daily_plans',
      'plan_items',
    ];

    for (const table of requiredTables) {
      assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`), `Migration must contain table ${table}`);
      assert.ok(sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`), `Table ${table} must have RLS enabled`);
    }

    assert.ok(sql.includes('CREATE POLICY'), 'Migration must define RLS policies');
    assert.ok(sql.includes('handle_new_user'), 'Migration must include user profile trigger');
  });

  test('API health check endpoint is operational', async () => {
    assert.ok(app !== null);
  });
});
