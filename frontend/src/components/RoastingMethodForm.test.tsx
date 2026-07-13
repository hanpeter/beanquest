import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoastingMethodForm } from './RoastingMethodForm';
import type { RoastingMethod } from '../types';

const EXISTING: RoastingMethod[] = [
  { id: 1, roaster_name: 'Popcorn popper', description: '', created_at: null, modified_at: null },
  { id: 2, roaster_name: 'Air roaster', description: '', created_at: null, modified_at: null },
];

function renderForm(overrides: Partial<React.ComponentProps<typeof RoastingMethodForm>> = {}) {
  const onCancel = vi.fn();
  const onSave = vi.fn();
  render(
    <RoastingMethodForm
      title="New roasting method"
      seed={{}}
      existing={EXISTING}
      editId={null}
      onCancel={onCancel}
      onSave={onSave}
      {...overrides}
    />,
  );
  return { onCancel, onSave };
}

describe('RoastingMethodForm', () => {
  it('renders the title and disables Save until a name is set', () => {
    renderForm();
    expect(screen.getByText('New roasting method')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('enables Save once a name is set, and saves the trimmed payload', async () => {
    const { onSave } = renderForm();
    await userEvent.type(screen.getByPlaceholderText('e.g. Popcorn popper, Drum roaster'), '  Whirley-Pop  ');
    await userEvent.type(
      screen.getByPlaceholderText('Equipment, batch size, technique, quirks to remember…'),
      '  Stovetop shaker.  ',
    );
    expect(screen.getByText('Save')).not.toBeDisabled();
    await userEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith({ roaster_name: 'Whirley-Pop', description: 'Stovetop shaker.' });
  });

  it('flags a case-insensitive duplicate name and keeps Save disabled', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('e.g. Popcorn popper, Drum roaster'), 'POPCORN popper');
    expect(screen.getByText('A method with this name already exists.')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('does not flag the method being edited as a duplicate of itself', () => {
    renderForm({ editId: 1, seed: { roaster_name: 'Popcorn popper' } });
    expect(screen.queryByText('A method with this name already exists.')).not.toBeInTheDocument();
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('pre-fills fields from seed (edit mode)', () => {
    renderForm({
      title: 'Edit roasting method',
      editId: 2,
      seed: { roaster_name: 'Air roaster', description: 'Fluid-bed build.' },
    });
    expect(screen.getByText('Edit roasting method')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Air roaster')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fluid-bed build.')).toBeInTheDocument();
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('disables Cancel and shows "Saving…" while saving, and shows the error message on failure', () => {
    renderForm({ saving: true, error: 'Something went wrong' });
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
