import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrewingMethodForm } from './BrewingMethodForm';
import type { BrewingMethod } from '../types';

const EXISTING: BrewingMethod[] = [
  { id: 1, method_name: 'Pour over', machine_used: '', grinder_used: '', created_at: null, modified_at: null },
  { id: 2, method_name: 'AeroPress', machine_used: '', grinder_used: '', created_at: null, modified_at: null },
];

function renderForm(overrides: Partial<React.ComponentProps<typeof BrewingMethodForm>> = {}) {
  const onCancel = vi.fn();
  const onSave = vi.fn();
  render(
    <BrewingMethodForm
      title="New brewing method"
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

describe('BrewingMethodForm', () => {
  it('renders the title and disables Save until a name is set', () => {
    renderForm();
    expect(screen.getByText('New brewing method')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('enables Save once a name is set, and saves the trimmed payload', async () => {
    const { onSave } = renderForm();
    await userEvent.type(screen.getByPlaceholderText('e.g. Pour over, Manual espresso'), '  French press  ');
    await userEvent.type(screen.getByPlaceholderText('e.g. Hario V60, Flair 58'), '  Bodum Chambord  ');
    await userEvent.type(screen.getByPlaceholderText('e.g. Comandante C40 hand grinder'), '  Comandante C40  ');
    expect(screen.getByText('Save')).not.toBeDisabled();
    await userEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith({
      method_name: 'French press',
      machine_used: 'Bodum Chambord',
      grinder_used: 'Comandante C40',
    });
  });

  it('flags a case-insensitive duplicate name and keeps Save disabled', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('e.g. Pour over, Manual espresso'), 'POUR over');
    expect(screen.getByText('A method with this name already exists.')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('does not flag the method being edited as a duplicate of itself', () => {
    renderForm({ editId: 1, seed: { method_name: 'Pour over' } });
    expect(screen.queryByText('A method with this name already exists.')).not.toBeInTheDocument();
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('pre-fills fields from seed (edit mode)', () => {
    renderForm({
      title: 'Edit brewing method',
      editId: 2,
      seed: { method_name: 'AeroPress', machine_used: 'AeroPress standard', grinder_used: 'Timemore C2' },
    });
    expect(screen.getByText('Edit brewing method')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AeroPress')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AeroPress standard')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Timemore C2')).toBeInTheDocument();
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('disables Cancel and shows "Saving…" while saving, and shows the error message on failure', () => {
    renderForm({ saving: true, error: 'Something went wrong' });
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
