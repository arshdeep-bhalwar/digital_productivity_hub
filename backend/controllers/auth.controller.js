import { getSupabaseAnonClient } from '../services/supabase.service.js';

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required for registration.',
        },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long.',
        },
      });
    }

    const anonClient = getSupabaseAnonClient();
    if (!anonClient) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Supabase authentication service is not configured.',
        },
      });
    }

    const { data, error } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
      message: 'Account created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required to log in.',
        },
      });
    }

    const anonClient = getSupabaseAnonClient();
    if (!anonClient) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Supabase authentication service is not configured.',
        },
      });
    }

    const { data, error } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: error.message || 'Invalid email or password.',
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
      message: 'Login successful.',
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const anonClient = getSupabaseAnonClient();
    if (anonClient) {
      await anonClient.auth.signOut();
    }
    res.json({
      success: true,
      data: {},
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    let profile = null;
    if (req.supabase && req.user) {
      const { data } = await req.supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      profile = data;
    }

    res.json({
      success: true,
      data: {
        user: req.user,
        profile: profile || {
          id: req.user.id,
          name: req.user.user_metadata?.name || req.user.email?.split('@')[0],
          email: req.user.email,
        },
      },
      message: 'User retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}
