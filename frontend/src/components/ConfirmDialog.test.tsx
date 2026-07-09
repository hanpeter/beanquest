import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('does not render its content when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete this log?"
        message="This can't be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText('Delete this log?')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    render(
      <ConfirmDialog
        open
        title="Delete this log?"
        message="This can't be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Delete this log?')).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it('uses the default confirm label "Delete"', () => {
    render(
      <ConfirmDialog open title="t" message="m" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('accepts a custom confirm label', () => {
    render(
      <ConfirmDialog open title="t" message="m" confirmLabel="Discard" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText('Discard')).toBeInTheDocument();
  });

  it('calls onConfirm and onCancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="t" message="m" onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
