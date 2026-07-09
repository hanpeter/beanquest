import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogDetail } from './LogDetail';
import type { PastLog } from '../types';

const LOG: PastLog = {
  id: 1, bean_name: 'Guatemala Huehuetenango', process: 'Washed',
  target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
  roasting_notes: 'first crack at 5:30, eased the heat',
  grinder_setting: '20 clicks', rating_score: 4,
  general_notes: 'Rich dark chocolate + toasted walnut.',
  date_logged: '2026-06-01T00:00:00', brewing_method_name: 'Manual espresso',
  roasting_method_name: 'Popcorn popper',
};

const SIBLING: PastLog = {
  ...LOG, id: 2, roasting_notes: '9 min, even roast', grinder_setting: '18 clicks',
  rating_score: 3, general_notes: '', date_logged: '2026-05-23T00:00:00', brewing_method_name: 'Pour over',
};

function renderDetail(overrides: Partial<React.ComponentProps<typeof LogDetail>> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onOpenSibling: vi.fn(),
    onBrewAgain: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<LogDetail log={LOG} siblings={[]} {...handlers} {...overrides} />);
  return handlers;
}

describe('LogDetail', () => {
  it('renders the header, roast, and brew sections with full untruncated text', () => {
    renderDetail();
    expect(screen.getByText('Guatemala Huehuetenango')).toBeInTheDocument();
    expect(screen.getByText('June 1, 2026', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('first crack at 5:30, eased the heat')).toBeInTheDocument();
    expect(screen.getByText('Rich dark chocolate + toasted walnut.')).toBeInTheDocument();
    expect(screen.getByText('20 clicks')).toBeInTheDocument();
  });

  it('shows "—" for an empty grinder setting', () => {
    renderDetail({ log: { ...LOG, grinder_setting: '' } });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('hides the tasting notes section when general_notes is empty', () => {
    renderDetail({ log: { ...LOG, general_notes: '' } });
    expect(screen.queryByText('Tasting notes')).not.toBeInTheDocument();
  });

  it('hides "Other brews of this bean" when there are no siblings', () => {
    renderDetail();
    expect(screen.queryByText('Other brews of this bean')).not.toBeInTheDocument();
  });

  it('renders siblings and opens one on click', async () => {
    const { onOpenSibling } = renderDetail({ siblings: [SIBLING] });
    expect(screen.getByText('Other brews of this bean')).toBeInTheDocument();
    await userEvent.click(screen.getByText(/Pour over/));
    expect(onOpenSibling).toHaveBeenCalledWith(2);
  });

  it('fires onBack, onBrewAgain, onEdit, onDelete', async () => {
    const handlers = renderDetail();
    await userEvent.click(screen.getByText('Logs'));
    expect(handlers.onBack).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Brew again'));
    expect(handlers.onBrewAgain).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Edit'));
    expect(handlers.onEdit).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Delete'));
    expect(handlers.onDelete).toHaveBeenCalledOnce();
  });
});
