import { render, screen } from '@testing-library/react';
import { App } from './App';
import * as api from './api';
import { setToken } from './api';
import type { PastLog } from './types';

const LOG: PastLog = {
  id: 1, bean_name: 'Guatemala Huehuetenango', process: 'Washed',
  target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
  roasting_notes: '', grinder_setting: '20 clicks', rating_score: 4,
  general_notes: '', date_logged: '2026-06-01T00:00:00',
  brewing_method_name: 'Manual espresso', roasting_method_name: 'Popcorn popper',
};

function setHash(hash: string) {
  window.location.hash = hash;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  setHash('');
});

describe('App — unauthenticated', () => {
  it('redirects an unauthenticated visit to /logs to the login screen', async () => {
    setHash('#/logs');
    const getPastLogsSpy = vi.spyOn(api, 'getPastLogs');
    render(<App />);
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    // No token, so no data call is even attempted on the way to the redirect.
    expect(getPastLogsSpy).not.toHaveBeenCalled();
  });

  it('remembers the attempted path and returns to it after login', async () => {
    setHash('#/roasting-methods');
    render(<App />);
    expect(await screen.findByText(/Redirected from \/roasting-methods/)).toBeInTheDocument();
  });
});

describe('App — stale token', () => {
  it('shows the app shell for one paint, then redirects on the 401 with no error Alert', async () => {
    setToken('stale-token', 'sam@example.com');
    // Stub fetch itself (not the api.ts exports) so request()'s own 401 handling —
    // clearing the token and firing the unauthorized event — actually runs.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: () => Promise.resolve({ detail: 'invalid or expired token' }),
      text: () => Promise.resolve('invalid or expired token'),
    }));
    setHash('#/logs');
    render(<App />);
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByText(/401/)).not.toBeInTheDocument();
    expect(localStorage.getItem('beanquest.access_token')).toBeNull();
  });
});

describe('App — valid token', () => {
  it('renders LogsPage directly, with no auth call ahead of the data fetch', async () => {
    setToken('good-token', 'sam@example.com');
    const getPastLogsSpy = vi.spyOn(api, 'getPastLogs').mockResolvedValue([LOG]);
    vi.spyOn(api, 'getRoastingMethods').mockResolvedValue([
      { id: 1, roaster_name: 'Popcorn popper', description: '', created_at: null, modified_at: null },
    ]);
    vi.spyOn(api, 'getBrewingMethods').mockResolvedValue([
      { id: 1, method_name: 'Manual espresso', machine_used: '', grinder_used: '', created_at: null, modified_at: null },
    ]);
    setHash('#/logs');
    render(<App />);
    expect(await screen.findByText('Guatemala Huehuetenango')).toBeInTheDocument();
    expect(getPastLogsSpy).toHaveBeenCalledTimes(1);
  });
});
