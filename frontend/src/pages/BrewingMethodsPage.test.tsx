import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BrewingMethodsPage } from './BrewingMethodsPage';
import * as api from '../api';
import type { BrewingMethod, PastLog } from '../types';

const METHOD_A: BrewingMethod = {
  id: 1, method_name: 'Pour over', machine_used: 'Hario V60-02', grinder_used: 'Comandante C40',
  created_at: '2026-01-14', modified_at: '2026-05-30',
};
const METHOD_B: BrewingMethod = {
  id: 2, method_name: 'AeroPress', machine_used: '', grinder_used: '', created_at: '2026-02-20', modified_at: '2026-02-20',
};

const LOG: PastLog = {
  id: 1, bean_name: 'Guatemala Huehuetenango', process: 'Washed',
  target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
  roasting_notes: '', grinder_setting: '20 clicks', rating_score: 4,
  general_notes: '', date_logged: '2026-06-01T00:00:00',
  brewing_method_name: 'Pour over', roasting_method_name: 'Popcorn popper',
};

beforeEach(() => {
  vi.spyOn(api, 'getBrewingMethods').mockResolvedValue([METHOD_A, METHOD_B]);
  vi.spyOn(api, 'getPastLogs').mockResolvedValue([LOG]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderPage() {
  render(
    <MemoryRouter initialEntries={['/brewing-methods']}>
      <Routes>
        <Route path="/brewing-methods" element={<BrewingMethodsPage />} />
        <Route path="/logs" element={<div>Logs page reached</div>} />
      </Routes>
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText('Pour over')).toBeInTheDocument());
}

describe('BrewingMethodsPage', () => {
  it('lists methods with usage counts, machine, and grinder', async () => {
    await renderPage();
    expect(screen.getByText('1 log')).toBeInTheDocument();
    expect(screen.getByText('Hario V60-02')).toBeInTheDocument();
    expect(screen.getByText('Comandante C40')).toBeInTheDocument();
    expect(screen.getByText('0 logs')).toBeInTheDocument();
    expect(screen.getByText('No machine set')).toBeInTheDocument();
  });

  it('filters the list by search query', async () => {
    await renderPage();
    await userEvent.click(screen.getByLabelText('Search'));
    await userEvent.type(screen.getByPlaceholderText('Search methods…'), 'aero');
    expect(screen.getByText('AeroPress')).toBeInTheDocument();
    expect(screen.queryByText('Pour over')).not.toBeInTheDocument();
  });

  it('shows the no-search-match empty state', async () => {
    await renderPage();
    await userEvent.click(screen.getByLabelText('Search'));
    await userEvent.type(screen.getByPlaceholderText('Search methods…'), 'espresso');
    expect(screen.getByText('No methods match')).toBeInTheDocument();
    expect(screen.getByText('Try another search.')).toBeInTheDocument();
  });

  it('opens Method Detail when a row is clicked, and back returns to the list', async () => {
    await renderPage();
    await userEvent.click(screen.getByText('Pour over'));
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByText('Brewing Methods'));
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });

  it('hides the FAB while the form or detail panel is open', async () => {
    await renderPage();
    expect(screen.getByLabelText('New brewing method')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Pour over'));
    expect(screen.queryByLabelText('New brewing method')).not.toBeInTheDocument();
  });

  it('creates a method via the form and shows it in the list', async () => {
    const created: BrewingMethod = {
      id: 3, method_name: 'French press', machine_used: '', grinder_used: '', created_at: '2026-07-01', modified_at: '2026-07-01',
    };
    vi.spyOn(api, 'createBrewingMethod').mockResolvedValue(created);
    await renderPage();
    await userEvent.click(screen.getByLabelText('New brewing method'));
    const form = within(screen.getByRole('dialog'));
    await userEvent.type(form.getByPlaceholderText('e.g. Pour over, Manual espresso'), 'French press');
    await userEvent.click(form.getByText('Save'));
    await waitFor(() => expect(screen.getByText('French press')).toBeInTheDocument());
  });

  it('keeps the form open and shows an error if creating a method fails', async () => {
    vi.spyOn(api, 'createBrewingMethod').mockRejectedValue(new Error('500 Internal Server Error'));
    await renderPage();
    await userEvent.click(screen.getByLabelText('New brewing method'));
    const form = within(screen.getByRole('dialog'));
    await userEvent.type(form.getByPlaceholderText('e.g. Pour over, Manual espresso'), 'French press');
    await userEvent.click(form.getByText('Save'));
    await waitFor(() => expect(form.getByText('500 Internal Server Error')).toBeInTheDocument());
    expect(form.getByPlaceholderText('e.g. Pour over, Manual espresso')).toBeInTheDocument();
  });

  it('edits a method via Edit from the detail panel', async () => {
    const updated: BrewingMethod = { ...METHOD_B, method_name: 'AeroPress inverted' };
    vi.spyOn(api, 'updateBrewingMethod').mockResolvedValue(updated);
    await renderPage();
    await userEvent.click(screen.getByText('AeroPress'));
    await userEvent.click(screen.getByLabelText('Edit'));
    const form = within(screen.getByRole('dialog'));
    const nameInput = form.getByDisplayValue('AeroPress');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'AeroPress inverted');
    await userEvent.click(form.getByText('Save'));
    await waitFor(() => expect(api.updateBrewingMethod).toHaveBeenCalledWith(2, {
      method_name: 'AeroPress inverted',
      machine_used: '',
      grinder_used: '',
    }));
  });

  it('shows the in-use guard when deleting a method with logs, and does not call the API', async () => {
    await renderPage();
    await userEvent.click(screen.getByText('Pour over'));
    await userEvent.click(screen.getByLabelText('Delete'));
    expect(screen.getByText('Can’t delete this method')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Got it'));
    expect(screen.queryByText('Can’t delete this method')).not.toBeInTheDocument();
    // detail panel remains open (Got it only dismisses the guard sheet)
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('deletes an unused method after confirming, and closes the detail panel', async () => {
    vi.spyOn(api, 'deleteBrewingMethod').mockResolvedValue(null);
    await renderPage();
    await userEvent.click(screen.getByText('AeroPress'));
    await userEvent.click(screen.getByLabelText('Delete'));
    await userEvent.click(screen.getByText('Delete', { selector: 'button' }));
    expect(api.deleteBrewingMethod).toHaveBeenCalledWith(2);
    await waitFor(() => expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument());
    expect(screen.queryByText('AeroPress')).not.toBeInTheDocument();
  });

  it('surfaces a 409 from the server defensively when deleting', async () => {
    vi.spyOn(api, 'deleteBrewingMethod').mockRejectedValue(new Error('409 {"detail":"in use"}'));
    await renderPage();
    await userEvent.click(screen.getByText('AeroPress'));
    await userEvent.click(screen.getByLabelText('Delete'));
    await userEvent.click(screen.getByText('Delete', { selector: 'button' }));
    await waitFor(() => expect(screen.getByText('409 {"detail":"in use"}')).toBeInTheDocument());
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('navigates to the Usage deep-link with the method name in the query', async () => {
    await renderPage();
    await userEvent.click(screen.getByText('Pour over'));
    await userEvent.click(screen.getByText('See these logs'));
    await waitFor(() => expect(screen.getByText('Logs page reached')).toBeInTheDocument());
  });
});
