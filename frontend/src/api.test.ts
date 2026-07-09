import { createPastLog, updatePastLog, deletePastLog } from './api';
import type { PastLogInput } from './types';

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
