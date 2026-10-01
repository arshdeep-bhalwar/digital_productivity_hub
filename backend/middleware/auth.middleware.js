import { getSupabaseAnonClient, createUserScopedClient } from '../services/supabase.service.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // If no token or guest token provided, fallback to seamless guest session context
    if (!token || token === 'null' || token === 'undefined' || token === 'guest-demo-token') {
      req.user = { id: 'usr-guest-demo', email: 'guest@demo.local' };
      req.supabase = null;
      return next();
    }

    const anonClient = getSupabaseAnonClient();

    if (!anonClient) {
      req.user = { id: 'usr-guest-demo', email: 'guest@demo.local' };
      req.supabase = null;
      return next();
    }

    const { data: { user }, error } = await anonClient.auth.getUser(token);

    if (error || !user) {
      // Fallback to guest user context if token is expired or invalid
      req.user = { id: 'usr-guest-demo', email: 'guest@demo.local' };
      req.supabase = null;
      return next();
    }

    req.user = user;
    req.supabase = createUserScopedClient(token);
    next();
  } catch (err) {
    req.user = { id: 'usr-guest-demo', email: 'guest@demo.local' };
    req.supabase = null;
    next();
  }
}
