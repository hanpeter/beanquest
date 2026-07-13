import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoastingMethodEntry } from './RoastingMethodEntry';
import type { RoastingMethod } from '../types';

const METHOD: RoastingMethod = {
  id: 1, roaster_name: 'Popcorn popper', description: 'West Bend Poppery II.',
  created_at: '2026-01-14', modified_at: '2026-05-30',
};

describe('RoastingMethodEntry', () => {
  it('renders the name, count, and description', () => {
    render(<RoastingMethodEntry method={METHOD} count={6} onClick={vi.fn()} />);
    expect(screen.getByText('Popcorn popper')).toBeInTheDocument();
    expect(screen.getByText('6 logs')).toBeInTheDocument();
    expect(screen.getByText('West Bend Poppery II.')).toBeInTheDocument();
  });

  it('uses singular "log" for a count of 1', () => {
    render(<RoastingMethodEntry method={METHOD} count={1} onClick={vi.fn()} />);
    expect(screen.getByText('1 log')).toBeInTheDocument();
  });

  it('shows "0 logs" for an unused method', () => {
    render(<RoastingMethodEntry method={METHOD} count={0} onClick={vi.fn()} />);
    expect(screen.getByText('0 logs')).toBeInTheDocument();
  });

  it('shows the placeholder when description is empty', () => {
    render(<RoastingMethodEntry method={{ ...METHOD, description: '' }} count={0} onClick={vi.fn()} />);
    expect(screen.getByText('No description yet')).toBeInTheDocument();
  });

  it('calls onClick when the row is clicked', async () => {
    const onClick = vi.fn();
    render(<RoastingMethodEntry method={METHOD} count={0} onClick={onClick} />);
    await userEvent.click(screen.getByText('Popcorn popper'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
