import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrewingMethodEntry } from './BrewingMethodEntry';
import type { BrewingMethod } from '../types';

const METHOD: BrewingMethod = {
  id: 1, method_name: 'Pour over', machine_used: 'Hario V60-02', grinder_used: 'Comandante C40',
  created_at: '2026-01-14', modified_at: '2026-05-30',
};

describe('BrewingMethodEntry', () => {
  it('renders the name, count, machine, and grinder', () => {
    render(<BrewingMethodEntry method={METHOD} count={6} onClick={vi.fn()} />);
    expect(screen.getByText('Pour over')).toBeInTheDocument();
    expect(screen.getByText('6 logs')).toBeInTheDocument();
    expect(screen.getByText('Hario V60-02')).toBeInTheDocument();
    expect(screen.getByText('Comandante C40')).toBeInTheDocument();
  });

  it('uses singular "log" for a count of 1', () => {
    render(<BrewingMethodEntry method={METHOD} count={1} onClick={vi.fn()} />);
    expect(screen.getByText('1 log')).toBeInTheDocument();
  });

  it('shows "0 logs" for an unused method', () => {
    render(<BrewingMethodEntry method={METHOD} count={0} onClick={vi.fn()} />);
    expect(screen.getByText('0 logs')).toBeInTheDocument();
  });

  it('shows the placeholder when machine is empty', () => {
    render(<BrewingMethodEntry method={{ ...METHOD, machine_used: '' }} count={0} onClick={vi.fn()} />);
    expect(screen.getByText('No machine set')).toBeInTheDocument();
  });

  it('shows the placeholder when grinder is empty', () => {
    render(<BrewingMethodEntry method={{ ...METHOD, grinder_used: '' }} count={0} onClick={vi.fn()} />);
    expect(screen.getByText('No grinder set')).toBeInTheDocument();
  });

  it('calls onClick when the row is clicked', async () => {
    const onClick = vi.fn();
    render(<BrewingMethodEntry method={METHOD} count={0} onClick={onClick} />);
    await userEvent.click(screen.getByText('Pour over'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
