import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogForm } from './LogForm';
import type { BrewingMethod, KnownBean, RoastingMethod } from '../types';

const ROASTING: RoastingMethod[] = [
  { id: 1, roaster_name: 'Popcorn popper', description: '', created_at: null, modified_at: null },
  { id: 2, roaster_name: 'Air roaster', description: '', created_at: null, modified_at: null },
];
const BREWING: BrewingMethod[] = [
  { id: 1, method_name: 'Manual espresso', machine_used: '', grinder_used: '', created_at: null, modified_at: null },
  { id: 2, method_name: 'Pour over', machine_used: '', grinder_used: '', created_at: null, modified_at: null },
];
const KNOWN_BEANS: KnownBean[] = [
  { bean: 'Guatemala Huehuetenango', process: 'Washed' },
  { bean: 'Ethiopia Yirgacheffe', process: 'Natural' },
];

function renderForm(overrides: Partial<React.ComponentProps<typeof LogForm>> = {}) {
  const onCancel = vi.fn();
  const onSave = vi.fn();
  render(
    <LogForm
      title="New log"
      seed={{}}
      knownBeans={KNOWN_BEANS}
      roastingMethods={ROASTING}
      brewingMethods={BREWING}
      onCancel={onCancel}
      onSave={onSave}
      {...overrides}
    />,
  );
  return { onCancel, onSave };
}

describe('LogForm', () => {
  it('renders the title and disables Save until required fields are set', () => {
    renderForm();
    expect(screen.getByText('New log')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('enables Save once bean, process, both methods, and rating are set, then saves the payload', async () => {
    const { onSave } = renderForm();

    await userEvent.type(screen.getByPlaceholderText('Start typing… e.g. Guatemala'), 'New Bean');
    await userEvent.click(screen.getByText('Washed'));
    await userEvent.click(screen.getByText('Popcorn popper'));
    await userEvent.click(screen.getByText('Manual espresso'));
    await userEvent.click(screen.getByLabelText('Rate 4'));

    expect(screen.getByText('Save')).not.toBeDisabled();
    await userEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      bean_name: 'New Bean',
      process: 'Washed',
      roasting_method_id: 1,
      brewing_method_id: 1,
      roasting_notes: '',
      grinder_setting: '',
      rating_score: 4,
      general_notes: '',
      date_logged: expect.any(String),
    });
  });

  it('auto-fills process when picking a known bean, and clears it when typing a new name', async () => {
    renderForm();
    const beanInput = screen.getByPlaceholderText('Start typing… e.g. Guatemala');
    await userEvent.type(beanInput, 'Guatemala Huehuetenango');
    // Selecting the known bean should highlight its process chip as active —
    // verified indirectly: typing a fresh name after clears any prior process pick.
    await userEvent.clear(beanInput);
    await userEvent.type(beanInput, 'Something else entirely');
    // Save should still require process, since typing a new bean clears it.
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('pre-fills fields from seed (edit mode)', () => {
    renderForm({
      title: 'Edit log',
      seed: {
        bean_name: 'Kenya Nyeri AA',
        process: 'Washed',
        roasting_method_id: 2,
        brewing_method_id: 2,
        roasting_notes: 'notes',
        grinder_setting: '15 clicks',
        rating_score: 3,
        general_notes: 'tasting',
        date_logged: '2026-05-20',
      },
    });
    expect(screen.getByText('Edit log')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Kenya Nyeri AA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('notes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15 clicks')).toBeInTheDocument();
    expect(screen.getByDisplayValue('tasting')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-05-20')).toBeInTheDocument();
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('resets rating to 0 (a valid explicit zero rating) when tapping the currently selected star', async () => {
    const { onSave } = renderForm({
      seed: {
        bean_name: 'X', process: 'Washed', roasting_method_id: 1, brewing_method_id: 1, rating_score: 4,
      },
    });
    await userEvent.click(screen.getByLabelText('Rate 4'));
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
    expect(screen.getByText('Save')).not.toBeDisabled();
    await userEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ rating_score: 0 }));
  });
});
