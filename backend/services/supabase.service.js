import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let anonClient = null;
let serviceClient = null;

export function getSupabaseAnonClient() {
  if (!anonClient && config.supabaseUrl && config.supabaseAnonKey) {
    anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  return anonClient;
}

export function getSupabaseServiceClient() {
  if (!serviceClient && config.supabaseUrl && config.supabaseServiceRoleKey) {
    serviceClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serviceClient;
}

/**
 * Creates a Supabase client scoped with the user's JWT access token so RLS policies apply.
 */
export function createUserScopedClient(accessToken) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}
