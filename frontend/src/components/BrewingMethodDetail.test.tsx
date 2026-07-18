import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrewingMethodDetail } from './BrewingMethodDetail';
import type { BrewingMethod } from '../types';

const METHOD: BrewingMethod = {
  id: 1, method_name: 'Pour over', machine_used: 'Hario V60-02', grinder_used: 'Comandante C40',
  created_at: '2026-01-14', modified_at: '2026-05-30',
};

function renderDetail(overrides: Partial<React.ComponentProps<typeof BrewingMethodDetail>> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUsage: vi.fn(),
  };
  render(<BrewingMethodDetail method={METHOD} count={6} lastUsed="2026-06-01T00:00:00" {...handlers} {...overrides} />);
  return handlers;
}

describe('BrewingMethodDetail', () => {
  it('renders the name, usage count, machine, and grinder', () => {
    renderDetail();
    expect(screen.getByText('Pour over')).toBeInTheDocument();
    expect(screen.getByText('6 logs')).toBeInTheDocument();
    expect(screen.getByText('Hario V60-02')).toBeInTheDocument();
    expect(screen.getByText('Comandante C40')).toBeInTheDocument();
  });

  it('shows the machine placeholder when empty', () => {
    renderDetail({ method: { ...METHOD, machine_used: '' } });
    expect(screen.getByText('No machine set — tap edit to add the brewer you use.')).toBeInTheDocument();
  });

  it('shows the grinder placeholder when empty', () => {
    renderDetail({ method: { ...METHOD, grinder_used: '' } });
    expect(screen.getByText('No grinder set.')).toBeInTheDocument();
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
    await userEvent.click(screen.getByText('Brewing Methods'));
    expect(handlers.onBack).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Edit'));
    expect(handlers.onEdit).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Delete'));
    expect(handlers.onDelete).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('See these logs'));
    expect(handlers.onUsage).toHaveBeenCalledOnce();
  });
});
