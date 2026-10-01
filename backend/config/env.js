import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:5000',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

export function validateEnv() {
  const missing = [];
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    console.warn(`[WARN] Missing environment variables: ${missing.join(', ')}. Server will run with mock/unconfigured credentials fallback.`);
  }
}
