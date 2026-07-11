import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoastingMethodsPage } from './RoastingMethodsPage';
import * as api from '../api';
import type { PastLog, RoastingMethod } from '../types';

const METHOD_A: RoastingMethod = {
  id: 1, roaster_name: 'Popcorn popper', description: 'West Bend Poppery II.',
  created_at: '2026-01-14', modified_at: '2026-05-30',
};
const METHOD_B: RoastingMethod = {
  id: 2, roaster_name: 'Air roaster', description: '', created_at: '2026-02-20', modified_at: '2026-02-20',
};

const LOG: PastLog = {
  id: 1, bean_name: 'Guatemala Huehuetenango', process: 'Washed',
  target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
  roasting_notes: '', grinder_setting: '20 clicks', rating_score: 4,
  general_notes: '', date_logged: '2026-06-01T00:00:00',
  brewing_method_name: 'Manual espresso', roasting_method_name: 'Popcorn popper',
};

beforeEach(() => {
  vi.spyOn(api, 'getRoastingMethods').mockResolvedValue([METHOD_A, METHOD_B]);
  vi.spyOn(api, 'getPastLogs').mockResolvedValue([LOG]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderPage() {
  render(
    <MemoryRouter initialEntries={['/roasting-methods']}>
      <Routes>
        <Route path="/roasting-methods" element={<RoastingMethodsPage />} />
        <Route path="/logs" element={<div>Logs page reached</div>} />
      </Routes>
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText('Popcorn popper')).toBeInTheDocument());
}

describe('RoastingMethodsPage', () => {
  it('lists methods with usage counts and descriptions', async () => {
    await renderPage();
    expect(screen.getByText('1 log')).toBeInTheDocument();
    expect(screen.getByText('West Bend Poppery II.')).toBeInTheDocument();
    expect(screen.getByText('0 logs')).toBeInTheDocument();
    expect(screen.getByText('No description yet')).toBeInTheDocument();
  });

  it('filters the list by search query', async () => {
    await renderPage();
    await userEvent.click(screen.getByLabelText('Search'));
    await userEvent.type(screen.getByPlaceholderText('Search methods…'), 'air');
    expect(screen.getByText('Air roaster')).toBeInTheDocument();
    expect(screen.queryByText('Popcorn popper')).not.toBeInTheDocument();
  });

  it('shows the no-search-match empty state', async () => {
    await renderPage();
    await userEvent.click(screen.getByLabelText('Search'));
    await userEvent.type(screen.getByPlaceholderText('Search methods…'), 'drum');
    expect(screen.getByText('No methods match')).toBeInTheDocument();
    expect(screen.getByText('Try another search.')).toBeInTheDocument();
  });

  it('opens Method Detail when a row is clicked, and back returns to the list', async () => {
    await renderPage();
    await userEvent.click(screen.getByText('Popcorn popper'));
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByText('Roasting Methods'));
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });

  it('hides the FAB while the form or detail panel is open', async () => {
    await renderPage();
    expect(screen.getByLabelText('New roasting method')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Popcorn popper'));
    expect(screen.queryByLabelText('New roasting method')).not.toBeInTheDocument();
  });

  it('creates a method via the form and shows it in the list', async () => {
    const created: RoastingMethod = {
      id: 3, roaster_name: 'Whirley-Pop', description: '', created_at: '2026-07-01', modified_at: '2026-07-01',
    };
    vi.spyOn(api, 'createRoastingMethod').mockResolvedValue(created);
    await renderPage();
    await userEvent.click(screen.getByLabelText('New roasting method'));
    const form = within(screen.getByRole('dialog'));
    await userEvent.type(form.getByPlaceholderText('e.g. Popcorn popper, Drum roaster'), 'Whirley-Pop');
    await userEvent.click(form.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Whirley-Pop')).toBeInTheDocument());
  });

  it('keeps the form open and shows an error if creating a method fails', async () => {
    vi.spyOn(api, 'createRoastingMethod').mockRejectedValue(new Error('500 Internal Server Error'));
    await renderPage();
    await userEvent.click(screen.getByLabelText('New roasting method'));
    const form = within(screen.getByRole('dialog'));
    await userEvent.type(form.getByPlaceholderText('e.g. Popcorn popper, Drum roaster'), 'Whirley-Pop');
    await userEvent.click(form.getByText('Save'));
    await waitFor(() => expect(form.getByText('500 Internal Server Error')).toBeInTheDocument());
    expect(form.getByPlaceholderText('e.g. Popcorn popper, Drum roaster')).toBeInTheDocument();
  });

  it('edits a method via Edit from the detail panel', async () => {
    const updated: RoastingMethod = { ...METHOD_B, roaster_name: 'Air roaster v2' };
    vi.spyOn(api, 'updateRoastingMethod').mockResolvedValue(updated);
    await renderPage();
    await userEvent.click(screen.getByText('Air roaster'));
    await userEvent.click(screen.getByLabelText('Edit'));
    const form = within(screen.getByRole('dialog'));
    const nameInput = form.getByDisplayValue('Air roaster');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Air roaster v2');
    await userEvent.click(form.getByText('Save'));
    await waitFor(() => expect(api.updateRoastingMethod).toHaveBeenCalledWith(2, {
      roaster_name: 'Air roaster v2',
      description: '',
    }));
  });

  it('shows the in-use guard when deleting a method with logs, and does not call the API', async () => {
    await renderPage();
    await userEvent.click(screen.getByText('Popcorn popper'));
    await userEvent.click(screen.getByLabelText('Delete'));
    expect(screen.getByText('Can’t delete this method')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Got it'));
    expect(screen.queryByText('Can’t delete this method')).not.toBeInTheDocument();
    // detail panel remains open (Got it only dismisses the guard sheet)
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('deletes an unused method after confirming, and closes the detail panel', async () => {
    vi.spyOn(api, 'deleteRoastingMethod').mockResolvedValue(null);
    await renderPage();
    await userEvent.click(screen.getByText('Air roaster'));
    await userEvent.click(screen.getByLabelText('Delete'));
    await userEvent.click(screen.getByText('Delete', { selector: 'button' }));
    expect(api.deleteRoastingMethod).toHaveBeenCalledWith(2);
    await waitFor(() => expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument());
    expect(screen.queryByText('Air roaster')).not.toBeInTheDocument();
  });

  it('surfaces a 409 from the server defensively when deleting', async () => {
    vi.spyOn(api, 'deleteRoastingMethod').mockRejectedValue(new Error('409 {"detail":"in use"}'));
    await renderPage();
    await userEvent.click(screen.getByText('Air roaster'));
    await userEvent.click(screen.getByLabelText('Delete'));
    await userEvent.click(screen.getByText('Delete', { selector: 'button' }));
    await waitFor(() => expect(screen.getByText('409 {"detail":"in use"}')).toBeInTheDocument());
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('navigates to the Usage deep-link with the method name in the query', async () => {
    await renderPage();
    await userEvent.click(screen.getByText('Popcorn popper'));
    await userEvent.click(screen.getByText('See these logs'));
    await waitFor(() => expect(screen.getByText('Logs page reached')).toBeInTheDocument());
  });
});
