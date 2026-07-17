import {
  createPastLog,
  updatePastLog,
  deletePastLog,
  createRoastingMethod,
  updateRoastingMethod,
  deleteRoastingMethod,
  createBrewingMethod,
  updateBrewingMethod,
  deleteBrewingMethod,
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

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
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
