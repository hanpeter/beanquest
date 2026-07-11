import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoastingMethodDetail } from './RoastingMethodDetail';
import type { RoastingMethod } from '../types';

const METHOD: RoastingMethod = {
  id: 1, roaster_name: 'Popcorn popper', description: 'West Bend Poppery II.',
  created_at: '2026-01-14', modified_at: '2026-05-30',
};

function renderDetail(overrides: Partial<React.ComponentProps<typeof RoastingMethodDetail>> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUsage: vi.fn(),
  };
  render(<RoastingMethodDetail method={METHOD} count={6} lastUsed="2026-06-01T00:00:00" {...handlers} {...overrides} />);
  return handlers;
}

describe('RoastingMethodDetail', () => {
  it('renders the name, usage count, and description', () => {
    renderDetail();
    expect(screen.getByText('Popcorn popper')).toBeInTheDocument();
    expect(screen.getByText('6 logs')).toBeInTheDocument();
    expect(screen.getByText('West Bend Poppery II.')).toBeInTheDocument();
  });

  it('shows the description placeholder when empty', () => {
    renderDetail({ method: { ...METHOD, description: '' } });
    expect(screen.getByText('No description yet — tap edit to add build notes or technique.')).toBeInTheDocument();
  });

  it('shows In logs / Last used in the Usage section', () => {
    renderDetail();
    expect(screen.getByText('6 brew logs')).toBeInTheDocument();
    expect(screen.getByText('June 1, 2026', { exact: false })).toBeInTheDocument();
  });

  it('shows "Never" for lastUsed when null', () => {
    renderDetail({ lastUsed: null });
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('is tappable even when count is 0', async () => {
    const { onUsage } = renderDetail({ count: 0, lastUsed: null });
    expect(screen.getByText('0 brew logs')).toBeInTheDocument();
    await userEvent.click(screen.getByText('See these logs'));
    expect(onUsage).toHaveBeenCalledOnce();
  });

  it('fires onBack, onEdit, onDelete, onUsage', async () => {
    const handlers = renderDetail();
    await userEvent.click(screen.getByText('Roasting Methods'));
    expect(handlers.onBack).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Edit'));
    expect(handlers.onEdit).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Delete'));
    expect(handlers.onDelete).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('See these logs'));
    expect(handlers.onUsage).toHaveBeenCalledOnce();
  });
});
