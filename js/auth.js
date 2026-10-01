import { request, setStoredSession, clearStoredSession, getStoredToken, getStoredUser } from './api.js';

export async function loginUser(email, password) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.success && response.data.session) {
    setStoredSession(response.data.session, response.data.user);
  }
  return response;
}

export async function registerUser(email, password, name) {
  const response = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  if (response.success && response.data.session) {
    setStoredSession(response.data.session, response.data.user);
  }
  return response;
}

export async function logoutUser() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Logout request warning:', err);
  } finally {
    clearStoredSession();
    window.location.href = '/index.html';
  }
}

export function getCurrentUser() {
  return getStoredUser();
}

export function checkAuthStatus() {
  return Boolean(getStoredToken());
}

export function requireAuthPage() {
  if (!checkAuthStatus()) {
    window.location.href = '/index.html';
  }
}
