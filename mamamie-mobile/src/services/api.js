// Thin client for the MamAmie backend (../backend). Adds the bearer token, refreshes it once on a 401,
// and turns failures into ApiError. Never logs request or response bodies (they hold health data).
import Constants from 'expo-constants';
import { loadTokens, saveTokens, clearTokens } from './tokenStorage';

const TIMEOUT_MS = 12000;

// EXPO_PUBLIC_API_URL wins. Otherwise assume the backend runs on the same machine as the Expo dev
// server (port 4000), which is how the phone reaches the laptop over the hotspot.
export function apiBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/+$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:4000/api/v1`;
}

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status; // 0 means the server could not be reached
    this.code = code;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

let tokens = null;
let tokensLoaded = false;
let refreshing = null;
const authLostListeners = new Set();

async function currentTokens() {
  if (!tokensLoaded) {
    tokens = await loadTokens();
    tokensLoaded = true;
  }
  return tokens;
}

export async function setTokens(next) {
  tokens = next;
  tokensLoaded = true;
  if (next) await saveTokens(next);
  else await clearTokens();
}

export const hasTokens = async () => !!(await currentTokens());

// Called when the refresh token is rejected, so the app can drop back to signed-out.
export function onAuthLost(fn) {
  authLostListeners.add(fn);
  return () => authLostListeners.delete(fn);
}

async function rawFetch(path, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    let json = null;
    if (res.status !== 204) {
      try {
        json = await res.json();
      } catch {}
    }
    if (!res.ok) throw new ApiError(res.status, json?.error || 'request_error', json?.message || `Request failed (${res.status})`);
    return json;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, 'network', 'Could not reach the MamAmie server.');
  } finally {
    clearTimeout(timer);
  }
}

// One refresh at a time; refresh tokens are single-use on the server.
function refreshTokens() {
  if (!refreshing) {
    refreshing = (async () => {
      const t = await currentTokens();
      if (!t?.refreshToken) throw new ApiError(401, 'unauthorized', 'Please sign in again.');
      try {
        const next = await rawFetch('/auth/refresh', { method: 'POST', body: { refreshToken: t.refreshToken } });
        await setTokens(next);
        return next;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await setTokens(null);
          authLostListeners.forEach((fn) => fn());
        }
        throw e;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  if (!auth) return rawFetch(path, { method, body });
  const t = await currentTokens();
  if (!t) throw new ApiError(401, 'unauthorized', 'Please sign in.');
  try {
    return await rawFetch(path, { method, body, token: t.accessToken });
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401) throw e;
    const next = await refreshTokens();
    return rawFetch(path, { method, body, token: next.accessToken });
  }
}

export const api = {
  register: (email, password, displayName) => request('/auth/register', { method: 'POST', body: { email, password, ...(displayName ? { displayName } : {}) }, auth: false }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: (refreshToken) => request('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),
  me: () => request('/me'),
  changePassword: (currentPassword, newPassword) => request('/me/password', { method: 'POST', body: { currentPassword, newPassword } }),
  deleteAccount: () => request('/me', { method: 'DELETE' }),
  syncPull: (since) => request(`/sync/pull?since=${since}`),
  syncPush: (changes) => request('/sync/push', { method: 'POST', body: { changes } }),
};
