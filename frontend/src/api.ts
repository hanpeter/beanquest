import type {
  PastLog,
  PastLogInput,
  RoastingMethod,
  RoastingMethodInput,
  BrewingMethod,
  BrewingMethodInput,
} from './types';

const TOKEN_KEY = 'beanquest.access_token';
const EMAIL_KEY = 'beanquest.account_email';

// Every accessor is wrapped — a private window or blocked site data can make
// localStorage throw on any call, not just return empty.

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAccountEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, email: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Nothing to fall back to — the session just won't survive a reload.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Already gone, or storage is unavailable — either way there's nothing to clear.
  }
}

/** Fired when a non-auth request 401s, so AuthContext can flip to signed-out and
 * RequireAuth can redirect. Auth endpoints (lookup/signup/login) never trigger this —
 * a wrong password there is an expected response, not a broken session. */
export const UNAUTHORIZED_EVENT = 'beanquest:unauthorized';

/** Thrown by request() instead of a flat Error, carrying the structured detail the
 * auth screens need: attemptsLeft from a 401 login failure, retryAfter from a 429. */
export class ApiError extends Error {
  status: number;
  detail: string;
  attemptsLeft: number | null;
  retryAfter: number | null;

  constructor(
    status: number,
    detail: string,
    attemptsLeft: number | null = null,
    retryAfter: number | null = null,
  ) {
    super(`${status} ${detail}`);
    this.status = status;
    this.detail = detail;
    this.attemptsLeft = attemptsLeft;
    this.retryAfter = retryAfter;
  }
}

// FastAPI's own 422 validation errors shape `detail` as a list of {loc, msg, ...};
// every other error handler in beanquest/api.py shapes it as a plain string.
function extractDetail(body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map(d => (d as { msg?: unknown })?.msg).filter(m => typeof m === 'string');
    if (msgs.length > 0) return msgs.join('; ');
  }
  return 'Request failed';
}

const AUTH_PATHS = ['/api/v1/auth/lookup', '/api/v1/auth/signup', '/api/v1/auth/login'];

async function request<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(path, init);
  if (res.status === 204) return null;
  if (!res.ok) {
    const responseBody = await res.json().catch(() => null);
    const detail = extractDetail(responseBody);
    const attemptsLeft = typeof (responseBody as { attempts_left?: unknown })?.attempts_left === 'number'
      ? (responseBody as { attempts_left: number }).attempts_left
      : null;
    const retryAfterHeader = res.headers?.get?.('Retry-After');
    const retryAfter = retryAfterHeader !== null && retryAfterHeader !== undefined
      ? Number(retryAfterHeader)
      : null;
    if (res.status === 401 && !AUTH_PATHS.includes(path)) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, detail, attemptsLeft, retryAfter);
  }
  return res.json() as Promise<T>;
}

export function getPastLogs(): Promise<PastLog[] | null> {
  return request<PastLog[]>('GET', '/api/v1/past-logs');
}

export function getRoastingMethods(): Promise<RoastingMethod[] | null> {
  return request<RoastingMethod[]>('GET', '/api/v1/roasting-methods');
}

export function getBrewingMethods(): Promise<BrewingMethod[] | null> {
  return request<BrewingMethod[]>('GET', '/api/v1/brewing-methods');
}

export function createPastLog(body: PastLogInput): Promise<PastLog | null> {
  return request<PastLog>('POST', '/api/v1/past-logs', body);
}

export function updatePastLog(id: number, body: PastLogInput): Promise<PastLog | null> {
  return request<PastLog>('PUT', `/api/v1/past-logs/${id}`, body);
}

export function deletePastLog(id: number): Promise<null> {
  return request<null>('DELETE', `/api/v1/past-logs/${id}`);
}

export function createRoastingMethod(body: RoastingMethodInput): Promise<RoastingMethod | null> {
  return request<RoastingMethod>('POST', '/api/v1/roasting-methods', body);
}

export function updateRoastingMethod(id: number, body: RoastingMethodInput): Promise<RoastingMethod | null> {
  return request<RoastingMethod>('PUT', `/api/v1/roasting-methods/${id}`, body);
}

export function deleteRoastingMethod(id: number): Promise<null> {
  return request<null>('DELETE', `/api/v1/roasting-methods/${id}`);
}

export function createBrewingMethod(body: BrewingMethodInput): Promise<BrewingMethod | null> {
  return request<BrewingMethod>('POST', '/api/v1/brewing-methods', body);
}

export function updateBrewingMethod(id: number, body: BrewingMethodInput): Promise<BrewingMethod | null> {
  return request<BrewingMethod>('PUT', `/api/v1/brewing-methods/${id}`, body);
}

export function deleteBrewingMethod(id: number): Promise<null> {
  return request<null>('DELETE', `/api/v1/brewing-methods/${id}`);
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export function lookupEmail(email: string): Promise<{ exists: boolean } | null> {
  return request<{ exists: boolean }>('POST', '/api/v1/auth/lookup', { email });
}

export function signup(body: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}): Promise<TokenResponse | null> {
  return request<TokenResponse>('POST', '/api/v1/auth/signup', body);
}

export function login(body: { email: string; password: string }): Promise<TokenResponse | null> {
  return request<TokenResponse>('POST', '/api/v1/auth/login', body);
}
