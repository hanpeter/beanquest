import { useState } from 'react';
import { Alert, Box, Dialog, TextField, Typography } from '@mui/material';
import type { BrewingMethod, BrewingMethodInput } from '../types';
import { isDuplicateName } from '../logic/brewingMethods';
import { CONTENT_MAX_WIDTH } from '../constants';

interface BrewingMethodFormProps {
  title: string;
  seed: Partial<BrewingMethodInput>;
  existing: BrewingMethod[];
  editId: number | null;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (input: BrewingMethodInput) => void;
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
        {label}
        {required && (
          <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
            *
          </Typography>
        )}
      </Typography>
      {children}
    </Box>
  );
}

export function BrewingMethodForm({
  title,
  seed,
  existing,
  editId,
  saving = false,
  error = null,
  onCancel,
  onSave,
}: BrewingMethodFormProps) {
  const [name, setName] = useState(seed.method_name ?? '');
  const [machineUsed, setMachineUsed] = useState(seed.machine_used ?? '');
  const [grinderUsed, setGrinderUsed] = useState(seed.grinder_used ?? '');

  const trimmed = name.trim();
  const duplicate = isDuplicateName(existing, trimmed, editId);
  const valid = trimmed.length > 0 && !duplicate;
  const canSave = valid && !saving;

  const save = () => {
    if (!canSave) return;
    onSave({ method_name: trimmed, machine_used: machineUsed.trim(), grinder_used: grinderUsed.trim() });
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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

            <Field label="Name" required>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Pour over, Manual espresso"
                value={name}
                autoComplete="off"
                onChange={e => setName(e.target.value)}
              />
              {duplicate && (
                <Typography variant="caption" sx={{ color: 'primary.main', display: 'block', mt: 0.75 }}>
                  A method with this name already exists.
                </Typography>
              )}
            </Field>

            <Field label="Machine used">
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Hario V60, Flair 58"
                value={machineUsed}
                autoComplete="off"
                onChange={e => setMachineUsed(e.target.value)}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                The brewer or machine for this method.
              </Typography>
            </Field>

            <Field label="Grinder used">
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Comandante C40 hand grinder"
                value={grinderUsed}
                autoComplete="off"
                onChange={e => setGrinderUsed(e.target.value)}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                Optional. The grinder you pair with this method.
              </Typography>
            </Field>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
