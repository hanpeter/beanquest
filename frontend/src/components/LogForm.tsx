import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Dialog,
  TextField,
  Typography,
} from '@mui/material';
import type { BrewingMethod, KnownBean, PastLogInput, RoastingMethod } from '../types';
import { CONTENT_MAX_WIDTH } from '../constants';

interface LogFormProps {
  title: string;
  seed: Partial<PastLogInput>;
  knownBeans: KnownBean[];
  processOptions: string[];
  roastingMethods: RoastingMethod[];
  brewingMethods: BrewingMethod[];
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (input: PastLogInput) => void;
}

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

interface PickChipProps<T> {
  options: T[];
  value: T | null;
  label: (option: T) => string;
  onSelect: (option: T) => void;
}

function PickRow<T>({ options, value, label, onSelect }: PickChipProps<T>) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {options.map((o, i) => {
        const active = value === o;
        return (
          <Box
            key={i}
            component="button"
            type="button"
            onClick={() => onSelect(o)}
            sx={{
              px: 1.5,
              py: 0.75,
              border: '1.5px solid',
              borderColor: active ? 'primary.main' : 'divider',
              bgcolor: active ? 'primary.main' : 'transparent',
              color: active ? 'primary.contrastText' : 'text.primary',
              cursor: 'pointer',
              borderRadius: 4,
              typography: 'body2',
              fontWeight: 500,
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            {label(o)}
          </Box>
        );
      })}
    </Box>
  );
}

interface StarPickerProps {
  value: number | null;
  onChange: (n: number) => void;
}

/**
 * Custom star picker (not MUI's <Rating>): clicking the currently-set star must
 * reset it to 0, but Rating is backed by native radio inputs, which never fire a
 * change event when clicking an already-checked radio.
 */
function StarPicker({ value, onChange }: StarPickerProps) {
  return (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const on = value != null && n <= value;
        return (
          <Box
            key={n}
            component="button"
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            aria-label={`Rate ${n}`}
            aria-pressed={on}
            sx={{
              border: 0,
              bgcolor: 'transparent',
              cursor: 'pointer',
              p: 0,
              fontSize: '1.75rem',
              lineHeight: 1,
              color: on ? 'warning.main' : 'text.disabled',
            }}
          >
            {on ? '★' : '☆'}
          </Box>
        );
      })}
    </Box>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          mb: 1
        }}>
        {label}
        {required && (
          <Typography
            component="span"
            sx={{
              color: "error.main",
              ml: 0.5
            }}>
            *
          </Typography>
        )}
      </Typography>
      {children}
    </Box>
  );
}

export function LogForm({
  title,
  seed,
  knownBeans,
  processOptions,
  roastingMethods,
  brewingMethods,
  saving = false,
  error = null,
  onCancel,
  onSave,
}: LogFormProps) {
  const [bean, setBean] = useState(seed.bean_name ?? '');
  const [process, setProcess] = useState(seed.process ?? '');
  const [roastingMethodId, setRoastingMethodId] = useState<number | null>(seed.roasting_method_id ?? null);
  const [roastingNotes, setRoastingNotes] = useState(seed.roasting_notes ?? '');
  const [brewingMethodId, setBrewingMethodId] = useState<number | null>(seed.brewing_method_id ?? null);
  const [grinderSetting, setGrinderSetting] = useState(seed.grinder_setting ?? '');
  const [rating, setRating] = useState<number | null>(seed.rating_score ?? null);
  const [generalNotes, setGeneralNotes] = useState(seed.general_notes ?? '');
  const [dateLogged, setDateLogged] = useState(seed.date_logged ?? today());

  const beanOptions = useMemo(() => knownBeans.map(b => b.bean), [knownBeans]);

  const pickBean = (name: string) => {
    setBean(name);
    const known = knownBeans.find(b => b.bean === name);
    setProcess(known ? known.process : '');
  };

  const valid = bean.trim() && process && roastingMethodId != null && brewingMethodId != null && rating != null;
  const canSave = valid && !saving;

  const save = () => {
    if (!canSave) return;
    onSave({
      bean_name: bean.trim(),
      process,
      roasting_method_id: roastingMethodId!,
      brewing_method_id: brewingMethodId!,
      roasting_notes: roastingNotes.trim(),
      grinder_setting: grinderSetting.trim(),
      rating_score: rating!,
      general_notes: generalNotes.trim(),
      date_logged: dateLogged,
    });
  };

  return (
    <Dialog fullScreen open onClose={saving ? undefined : onCancel}>
      <Box
        component="form"
        onSubmit={e => { e.preventDefault(); save(); }}
        sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={onCancel}
            disabled={saving}
            sx={{
              border: 0,
              bgcolor: 'transparent',
              cursor: saving ? 'default' : 'pointer',
              typography: 'body1',
              color: saving ? 'text.disabled' : 'text.primary',
            }}
          >
            Cancel
          </Box>
          <Typography variant="subtitle1" sx={{
            fontWeight: 600
          }}>
            {title}
          </Typography>
          <Box
            component="button"
            type="submit"
            disabled={!canSave}
            sx={{
              border: 0,
              bgcolor: 'transparent',
              cursor: canSave ? 'pointer' : 'default',
              typography: 'body1',
              fontWeight: 600,
              color: canSave ? 'primary.main' : 'text.disabled',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          <Field label="Bean" required>
            <Autocomplete
              freeSolo
              options={beanOptions}
              inputValue={bean}
              onInputChange={(_e, value, reason) => {
                if (reason === 'input') pickBean(value);
              }}
              onChange={(_e, value) => {
                if (value) pickBean(value);
              }}
              renderInput={params => (
                <TextField {...params} placeholder="Start typing… e.g. Guatemala" size="small" />
              )}
            />
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: 'block',
                mt: 0.75
              }}>
              Pick an existing bean to carry its process over, or keep typing to add a new one.
            </Typography>
          </Field>

          <Field label="Process" required>
            <Autocomplete
              freeSolo
              options={processOptions}
              inputValue={process}
              onInputChange={(_e, value, reason) => {
                if (reason === 'input') setProcess(value);
              }}
              onChange={(_e, value) => {
                if (value) setProcess(value);
              }}
              renderInput={params => (
                <TextField {...params} placeholder="Start typing… e.g. Washed" size="small" />
              )}
            />
          </Field>

          <Field label="Roasting method" required>
            <PickRow
              options={roastingMethods}
              value={roastingMethods.find(r => r.id === roastingMethodId) ?? null}
              label={r => r.roaster_name}
              onSelect={r => setRoastingMethodId(r.id)}
            />
          </Field>

          <Field label="Roasting notes">
            <TextField
              multiline
              minRows={2}
              fullWidth
              placeholder="Time, first crack, heat/fan profile, stirring…"
              value={roastingNotes}
              onChange={e => setRoastingNotes(e.target.value)}
            />
          </Field>

          <Field label="Brewing method" required>
            <PickRow
              options={brewingMethods}
              value={brewingMethods.find(b => b.id === brewingMethodId) ?? null}
              label={b => b.method_name}
              onSelect={b => setBrewingMethodId(b.id)}
            />
          </Field>

          <Field label="Grinder setting">
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 20 clicks, Step 11"
              value={grinderSetting}
              onChange={e => setGrinderSetting(e.target.value)}
            />
          </Field>

          <Field label="Rating" required>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StarPicker value={rating} onChange={setRating} />
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {rating == null ? 'Tap to rate' : `${rating} / 5`}
              </Typography>
            </Box>
          </Field>

          <Field label="General notes">
            <TextField
              multiline
              minRows={2}
              fullWidth
              placeholder="Tasting notes, what to change next time…"
              value={generalNotes}
              onChange={e => setGeneralNotes(e.target.value)}
            />
          </Field>

          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                mb: 1
              }}>
              Date logged
            </Typography>
            <TextField
              type="date"
              size="small"
              value={dateLogged}
              onChange={e => setDateLogged(e.target.value)}
            />
          </Box>
        </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
