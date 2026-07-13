import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoastingMethodDeleteDialog } from './RoastingMethodDeleteDialog';
import type { RoastingMethod } from '../types';

const METHOD: RoastingMethod = {
  id: 1, roaster_name: 'Popcorn popper', description: '', created_at: null, modified_at: null,
};

describe('RoastingMethodDeleteDialog', () => {
  it('renders nothing when method is null', () => {
    render(<RoastingMethodDeleteDialog method={null} count={0} onCancel={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/Delete/)).not.toBeInTheDocument();
  });

  it('shows the in-use guard when count > 0, with only a dismiss button', async () => {
    const onCancel = vi.fn();
    const onDelete = vi.fn();
    render(<RoastingMethodDeleteDialog method={METHOD} count={3} onCancel={onCancel} onDelete={onDelete} />);
    expect(screen.getByText('Can’t delete this method')).toBeInTheDocument();
    expect(screen.getByText(/is used by/)).toBeInTheDocument();
    expect(screen.getByText('3 logs', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('Delete', { selector: 'button' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Got it'));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('uses singular "log" in the in-use guard for count === 1', () => {
    render(<RoastingMethodDeleteDialog method={METHOD} count={1} onCancel={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('1 log', { exact: false })).toBeInTheDocument();
  });

  it('shows the destructive confirm when count is 0', async () => {
    const onCancel = vi.fn();
    const onDelete = vi.fn();
    render(<RoastingMethodDeleteDialog method={METHOD} count={0} onCancel={onCancel} onDelete={onDelete} />);
    expect(screen.getByText('Delete "Popcorn popper"?')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('surfaces loading and error state on the destructive confirm', () => {
    render(
      <RoastingMethodDeleteDialog
        method={METHOD}
        count={0}
        loading
        error="409 Conflict"
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Deleting…')).toBeInTheDocument();
    expect(screen.getByText('409 Conflict')).toBeInTheDocument();
  });
});
