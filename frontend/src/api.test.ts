import {
  ApiError,
  UNAUTHORIZED_EVENT,
  clearToken,
  createPastLog,
  updatePastLog,
  deletePastLog,
  createRoastingMethod,
  updateRoastingMethod,
  deleteRoastingMethod,
  createBrewingMethod,
  updateBrewingMethod,
  deleteBrewingMethod,
  getAccountEmail,
  getPastLogs,
  getToken,
  login,
  lookupEmail,
  setToken,
  signup,
} from './api';
import type { PastLogInput, RoastingMethodInput, BrewingMethodInput } from './types';

const INPUT: PastLogInput = {
  bean_name: 'Guatemala',
  process: 'Washed',
  roasting_method_id: 1,
  brewing_method_id: 1,
  roasting_notes: '',
  grinder_setting: 'Step 11',
  rating_score: 4,
  general_notes: '',
  date_logged: '2026-06-01',
};

function mockFetch(status: number, body: unknown, headers?: Record<string, string>) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: headers ? new Headers(headers) : undefined,
  });
}

describe('createPastLog', () => {
  it('POSTs to /api/v1/past-logs with the input body', async () => {
    const fetchMock = mockFetch(201, { id: 1, ...INPUT });
    vi.stubGlobal('fetch', fetchMock);
    const result = await createPastLog(INPUT);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/past-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(INPUT),
    });
    expect(result).toEqual({ id: 1, ...INPUT });
    vi.unstubAllGlobals();
  });

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(422, { detail: 'invalid' }));
    await expect(createPastLog(INPUT)).rejects.toThrow('422');
    vi.unstubAllGlobals();
  });
});

describe('updatePastLog', () => {
  it('PUTs to /api/v1/past-logs/{id} with the input body', async () => {
    const fetchMock = mockFetch(200, { id: 5, ...INPUT });
    vi.stubGlobal('fetch', fetchMock);
    const result = await updatePastLog(5, INPUT);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/past-logs/5', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(INPUT),
    });
    expect(result).toEqual({ id: 5, ...INPUT });
    vi.unstubAllGlobals();
  });
});

describe('deletePastLog', () => {
  it('DELETEs /api/v1/past-logs/{id} and returns null on 204', async () => {
    const fetchMock = mockFetch(204, null);
    vi.stubGlobal('fetch', fetchMock);
    const result = await deletePastLog(5);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/past-logs/5', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });
});

const METHOD_INPUT: RoastingMethodInput = {
  roaster_name: 'Popcorn popper',
  description: 'West Bend Poppery II, thermostat bypassed.',
};

describe('createRoastingMethod', () => {
  it('POSTs to /api/v1/roasting-methods with the input body', async () => {
    const fetchMock = mockFetch(201, { id: 1, ...METHOD_INPUT });
    vi.stubGlobal('fetch', fetchMock);
    const result = await createRoastingMethod(METHOD_INPUT);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/roasting-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(METHOD_INPUT),
    });
    expect(result).toEqual({ id: 1, ...METHOD_INPUT });
    vi.unstubAllGlobals();
  });

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(422, { detail: 'invalid' }));
    await expect(createRoastingMethod(METHOD_INPUT)).rejects.toThrow('422');
    vi.unstubAllGlobals();
  });
});

describe('updateRoastingMethod', () => {
  it('PUTs to /api/v1/roasting-methods/{id} with the input body', async () => {
    const fetchMock = mockFetch(200, { id: 5, ...METHOD_INPUT });
    vi.stubGlobal('fetch', fetchMock);
    const result = await updateRoastingMethod(5, METHOD_INPUT);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/roasting-methods/5', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(METHOD_INPUT),
    });
    expect(result).toEqual({ id: 5, ...METHOD_INPUT });
    vi.unstubAllGlobals();
  });
});

describe('deleteRoastingMethod', () => {
  it('DELETEs /api/v1/roasting-methods/{id} and returns null on 204', async () => {
    const fetchMock = mockFetch(204, null);
    vi.stubGlobal('fetch', fetchMock);
    const result = await deleteRoastingMethod(5);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/roasting-methods/5', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });

  it('throws on a 409 conflict (method still referenced by logs)', async () => {
    vi.stubGlobal('fetch', mockFetch(409, { detail: 'RoastingMethod 5 is referenced by existing past_logs' }));
    await expect(deleteRoastingMethod(5)).rejects.toThrow('409');
    vi.unstubAllGlobals();
  });
});

const BREWING_METHOD_INPUT: BrewingMethodInput = {
  method_name: 'Pour over',
  machine_used: 'Hario V60-02',
  grinder_used: 'Comandante C40',
};

describe('createBrewingMethod', () => {
  it('POSTs to /api/v1/brewing-methods with the input body', async () => {
    const fetchMock = mockFetch(201, { id: 1, ...BREWING_METHOD_INPUT });
    vi.stubGlobal('fetch', fetchMock);
    const result = await createBrewingMethod(BREWING_METHOD_INPUT);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/brewing-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BREWING_METHOD_INPUT),
    });
    expect(result).toEqual({ id: 1, ...BREWING_METHOD_INPUT });
    vi.unstubAllGlobals();
  });

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(422, { detail: 'invalid' }));
    await expect(createBrewingMethod(BREWING_METHOD_INPUT)).rejects.toThrow('422');
    vi.unstubAllGlobals();
  });
});

describe('updateBrewingMethod', () => {
  it('PUTs to /api/v1/brewing-methods/{id} with the input body', async () => {
    const fetchMock = mockFetch(200, { id: 5, ...BREWING_METHOD_INPUT });
    vi.stubGlobal('fetch', fetchMock);
    const result = await updateBrewingMethod(5, BREWING_METHOD_INPUT);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/brewing-methods/5', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BREWING_METHOD_INPUT),
    });
    expect(result).toEqual({ id: 5, ...BREWING_METHOD_INPUT });
    vi.unstubAllGlobals();
  });
});

describe('deleteBrewingMethod', () => {
  it('DELETEs /api/v1/brewing-methods/{id} and returns null on 204', async () => {
    const fetchMock = mockFetch(204, null);
    vi.stubGlobal('fetch', fetchMock);
    const result = await deleteBrewingMethod(5);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/brewing-methods/5', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });

  it('throws on a 409 conflict (method still referenced by logs)', async () => {
    vi.stubGlobal('fetch', mockFetch(409, { detail: 'BrewingMethod 5 is referenced by existing past_logs' }));
    await expect(deleteBrewingMethod(5)).rejects.toThrow('409');
    vi.unstubAllGlobals();
  });
});

describe('token storage', () => {
  afterEach(() => {
    clearToken();
  });

  it('setToken/getToken/clearToken round-trip the token and account email together', () => {
    expect(getToken()).toBeNull();
    setToken('tok123', 'sam@example.com');
    expect(getToken()).toBe('tok123');
    expect(getAccountEmail()).toBe('sam@example.com');
    clearToken();
    expect(getToken()).toBeNull();
    expect(getAccountEmail()).toBeNull();
  });
});

describe('request() auth header', () => {
  afterEach(() => {
    clearToken();
    vi.unstubAllGlobals();
  });

  it('attaches Authorization when a token is stored', async () => {
    setToken('tok123', 'sam@example.com');
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await getPastLogs();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/past-logs', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok123' },
    });
  });

  it('omits Authorization when no token is stored', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await getPastLogs();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/past-logs', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('ApiError', () => {
  afterEach(() => {
    clearToken();
    vi.unstubAllGlobals();
  });

  it('carries a plain-string detail from a custom error handler', async () => {
    vi.stubGlobal('fetch', mockFetch(409, { detail: 'Conflict' }));
    await expect(getPastLogs()).rejects.toMatchObject({ status: 409, detail: 'Conflict' });
  });

  it('joins FastAPI 422 validation errors into one detail string', async () => {
    vi.stubGlobal('fetch', mockFetch(422, {
      detail: [
        { loc: ['body', 'password'], msg: 'password must be at least 10 characters long' },
      ],
    }));
    await expect(getPastLogs()).rejects.toMatchObject({
      status: 422,
      detail: 'password must be at least 10 characters long',
    });
  });

  it('captures attempts_left from a 401 login failure', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { detail: 'invalid credentials', attempts_left: 2 }));
    await expect(login({ email: 'sam@example.com', password: 'wrong' }))
      .rejects.toMatchObject({ status: 401, attemptsLeft: 2 });
  });

  it('captures Retry-After from a 429', async () => {
    vi.stubGlobal('fetch', mockFetch(429, { detail: 'rate limited' }, { 'Retry-After': '278' }));
    await expect(login({ email: 'sam@example.com', password: 'wrong' }))
      .rejects.toMatchObject({ status: 429, retryAfter: 278 });
  });

  it('is an instance of ApiError', async () => {
    vi.stubGlobal('fetch', mockFetch(500, { detail: 'boom' }));
    await expect(getPastLogs()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('401 on a non-auth route', () => {
  afterEach(() => {
    clearToken();
    vi.unstubAllGlobals();
  });

  it('clears the stored token and fires the unauthorized event', async () => {
    setToken('stale-token', 'sam@example.com');
    vi.stubGlobal('fetch', mockFetch(401, { detail: 'invalid or expired token' }));
    const handler = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    await expect(getPastLogs()).rejects.toThrow();
    expect(getToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  });

  it('does not clear the token or fire the event for a 401 on the login route itself', async () => {
    setToken('some-token', 'sam@example.com');
    vi.stubGlobal('fetch', mockFetch(401, { detail: 'invalid credentials', attempts_left: 4 }));
    const handler = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    await expect(login({ email: 'sam@example.com', password: 'wrong' })).rejects.toThrow();
    expect(getToken()).toBe('some-token');
    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  });
});

describe('auth endpoints', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lookupEmail POSTs to /api/v1/auth/lookup', async () => {
    const fetchMock = mockFetch(200, { exists: true });
    vi.stubGlobal('fetch', fetchMock);
    const result = await lookupEmail('sam@example.com');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sam@example.com' }),
    });
    expect(result).toEqual({ exists: true });
  });

  it('signup POSTs to /api/v1/auth/signup', async () => {
    const body = { first_name: 'Sam', last_name: 'Okafor', email: 'sam@example.com', password: 'Str0ngPass!word' };
    const fetchMock = mockFetch(201, { access_token: 'tok', token_type: 'bearer' });
    vi.stubGlobal('fetch', fetchMock);
    const result = await signup(body);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(result).toEqual({ access_token: 'tok', token_type: 'bearer' });
  });

  it('login POSTs to /api/v1/auth/login', async () => {
    const body = { email: 'sam@example.com', password: 'Str0ngPass!word' };
    const fetchMock = mockFetch(200, { access_token: 'tok', token_type: 'bearer' });
    vi.stubGlobal('fetch', fetchMock);
    const result = await login(body);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(result).toEqual({ access_token: 'tok', token_type: 'bearer' });
  });
});
