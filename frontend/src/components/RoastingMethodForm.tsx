import { useState } from 'react';
import { Alert, Box, Dialog, TextField, Typography } from '@mui/material';
import type { RoastingMethod, RoastingMethodInput } from '../types';
import { isDuplicateName } from '../logic/roastingMethods';
import { CONTENT_MAX_WIDTH } from '../constants';

interface RoastingMethodFormProps {
  title: string;
  seed: Partial<RoastingMethodInput>;
  existing: RoastingMethod[];
  editId: number | null;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (input: RoastingMethodInput) => void;
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

export function RoastingMethodForm({
  title,
  seed,
  existing,
  editId,
  saving = false,
  error = null,
  onCancel,
  onSave,
}: RoastingMethodFormProps) {
  const [name, setName] = useState(seed.roaster_name ?? '');
  const [description, setDescription] = useState(seed.description ?? '');

  const trimmed = name.trim();
  const duplicate = isDuplicateName(existing, trimmed, editId);
  const valid = trimmed.length > 0 && !duplicate;
  const canSave = valid && !saving;

  const save = () => {
    if (!canSave) return;
    onSave({ roaster_name: trimmed, description: description.trim() });
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
                placeholder="e.g. Popcorn popper, Drum roaster"
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

            <Field label="Description">
              <TextField
                multiline
                minRows={3}
                fullWidth
                placeholder="Equipment, batch size, technique, quirks to remember…"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                Optional. Your build notes and how you run this roaster.
              </Typography>
            </Field>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
