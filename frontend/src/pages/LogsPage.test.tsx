import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogsPage } from './LogsPage';
import * as api from '../api';
import type { PastLog } from '../types';

const LOG: PastLog = {
  id: 1, bean_name: 'Guatemala Huehuetenango', process: 'Washed',
  target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
  roasting_notes: 'first crack at 5:30', grinder_setting: '20 clicks', rating_score: 4,
  general_notes: 'Rich dark chocolate.', date_logged: '2026-06-01T00:00:00',
  brewing_method_name: 'Manual espresso', roasting_method_name: 'Popcorn popper',
};

beforeEach(() => {
  vi.spyOn(api, 'getPastLogs').mockResolvedValue([LOG]);
  vi.spyOn(api, 'getRoastingMethods').mockResolvedValue([
    { id: 1, roaster_name: 'Popcorn popper', description: '', created_at: null, modified_at: null },
  ]);
  vi.spyOn(api, 'getBrewingMethods').mockResolvedValue([
    { id: 1, method_name: 'Manual espresso', machine_used: '', grinder_used: '', created_at: null, modified_at: null },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderPage() {
  render(<LogsPage />);
  await waitFor(() => expect(screen.getByText('Guatemala Huehuetenango')).toBeInTheDocument());
}

describe('LogsPage', () => {
  it('opens Log Detail when a row is clicked, and back returns to the list', async () => {
    await renderPage();
    await userEvent.click(screen.getByText('20 clicks', { exact: false }));
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByText('Logs'));
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });

  it('opens the New Log form from the FAB, and Cancel closes it', async () => {
    await renderPage();
    await userEvent.click(screen.getByLabelText('New log'));
    expect(screen.getByPlaceholderText('Start typing… e.g. Guatemala')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Start typing… e.g. Guatemala')).not.toBeInTheDocument();
  });

  it('hides the FAB while the form or detail panel is open', async () => {
    await renderPage();
    expect(screen.getByLabelText('New log')).toBeInTheDocument();
    await userEvent.click(screen.getByText('20 clicks', { exact: false }));
    expect(screen.queryByLabelText('New log')).not.toBeInTheDocument();
  });

  it('deletes a log after confirming, and closes the detail panel', async () => {
    vi.spyOn(api, 'deletePastLog').mockResolvedValue(null);
    await renderPage();
    await userEvent.click(screen.getByText('20 clicks', { exact: false }));
    await userEvent.click(screen.getByLabelText('Delete'));
    await userEvent.click(screen.getByText('Delete', { selector: 'button' }));
    expect(api.deletePastLog).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument());
    expect(screen.getByText('No logs match')).toBeInTheDocument();
  });

  it('creates a log via the form and shows it in the list', async () => {
    const created: PastLog = { ...LOG, id: 2, bean_name: 'Kenya Nyeri AA' };
    vi.spyOn(api, 'createPastLog').mockResolvedValue(created);
    await renderPage();
    await userEvent.click(screen.getByLabelText('New log'));
    const form = within(screen.getByRole('dialog'));
    await userEvent.type(form.getByPlaceholderText('Start typing… e.g. Guatemala'), 'Kenya Nyeri AA');
    await userEvent.click(form.getByText('Washed'));
    await userEvent.click(form.getByText('Popcorn popper'));
    await userEvent.click(form.getByText('Manual espresso'));
    await userEvent.click(form.getByLabelText('Rate 5'));
    await userEvent.click(form.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Kenya Nyeri AA')).toBeInTheDocument());
  });
});
