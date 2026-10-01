/**
 * Centralized API client wrapper for Digital Productivity Hub
 */

const API_BASE_URL = '/api';

export function getStoredToken() {
  return localStorage.getItem('dph_access_token');
}

export function setStoredSession(session, user) {
  if (session && session.access_token) {
    localStorage.setItem('dph_access_token', session.access_token);
  }
  if (user) {
    localStorage.setItem('dph_user', JSON.stringify(user));
  }
}

export function clearStoredSession() {
  localStorage.removeItem('dph_access_token');
  localStorage.removeItem('dph_user');
}

export function getStoredUser() {
  const userStr = localStorage.getItem('dph_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => ({
      success: false,
      error: { code: 'INVALID_RESPONSE', message: 'Invalid server response' },
    }));

    if (response.status === 401) {
      // Clear token if unauthenticated
      clearStoredSession();
      // If page is protected, redirect to login
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = '/index.html';
      }
    }

    if (!response.ok || !result.success) {
      const errorMsg = result.error?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.code = result.error?.code || 'API_ERROR';
      err.status = response.status;
      throw err;
    }

    return result;
  } catch (err) {
    console.error(`[API ERROR] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}
