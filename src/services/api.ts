const AUTH_JWT_KEY = 'auth_jwt';
const AUTH_KEYS = ['auth_jwt', 'user_role', 'user_email', 'is_logged_in', 'profile_complete'];

const BASE_URL = 'https://canoe-health-be-production.up.railway.app';
const CHAT_SERVICE_URL = 'https://spirited-compassion-production.up.railway.app';

let onSessionExpiredCallback: (() => void) | null = null;

export function setOnSessionExpired(cb: (() => void) | null) {
  onSessionExpiredCallback = cb;
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_JWT_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(AUTH_JWT_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(AUTH_JWT_KEY);
}

export function clearSession() {
  AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
  onSessionExpiredCallback?.();
}

export function triggerLogout() {
  [...AUTH_KEYS, 'has_seen_onboarding'].forEach((k) => localStorage.removeItem(k));
  onSessionExpiredCallback?.();
}

export function getProfilePicUrl(pic: string | null | undefined): string | null {
  if (!pic?.trim()) return null;
  if (pic.startsWith('http')) return pic;
  return `${BASE_URL}/${pic.replace(/^\//, '')}`;
}

function buildHeaders(useAuth: boolean, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (useAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

interface RequestOptions {
  useAuth?: boolean;
  headers?: Record<string, string>;
}

async function request(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<Response> {
  const { useAuth = true, headers: extra } = opts;
  const isChatReq = (path.startsWith('/chat') && !path.startsWith('/chat/upload')) || path.startsWith('/meetings');
  const base = isChatReq ? CHAT_SERVICE_URL : BASE_URL;
  const url = path.startsWith('http') ? path : `${base}/${path.replace(/^\//, '')}`;
  const headers = buildHeaders(useAuth, extra);
  const isFormData = body instanceof FormData;
  if (isFormData) delete headers['Content-Type'];

  const config: RequestInit = { method, headers };
  if (body != null && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = isFormData ? (body as FormData) : JSON.stringify(body);
  }

  const res = await fetch(url, config);
  // Only clear the local session for 401s coming from auth endpoints.
  // Other modules (e.g. feature flags, role-based APIs) might legitimately return 401/403
  // without meaning that the whole user session is invalid.
  if (res.status === 401 && useAuth && headers.Authorization && path.replace(/^\//, '').startsWith('auth/')) {
    clearSession();
  }
  return res;
}

export async function parseResponse<T = unknown>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string })?.message || res.statusText || `HTTP ${res.status}`;
    const err = Object.assign(new Error(msg), { status: res.status, data });
    throw err;
  }
  return data as T;
}

const api = {
  get: (path: string, opts?: RequestOptions) => request('GET', path, undefined, opts),
  post: (path: string, body?: unknown, opts?: RequestOptions) => request('POST', path, body, opts),
  put: (path: string, body?: unknown, opts?: RequestOptions) => request('PUT', path, body, opts),
  patch: (path: string, body?: unknown, opts?: RequestOptions) => request('PATCH', path, body, opts),
  del: (path: string, opts?: RequestOptions) => request('DELETE', path, undefined, opts),
  parseResponse,
  getToken,
  setToken,
  clearToken,
  clearSession,
  triggerLogout,
  setOnSessionExpired,
  getProfilePicUrl,
};

export default api;
