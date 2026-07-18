import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { BrewingMethod } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface BrewingMethodDeleteDialogProps {
  method: BrewingMethod | null;
  count: number;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onDelete: () => void;
}

/**
 * Two variants chosen by usage count: an in-use method can't be deleted
 * (mirrors the API's ON DELETE RESTRICT → 409) and only offers dismissal;
 * an unused method gets the standard destructive confirm.
 */
export function BrewingMethodDeleteDialog({
  method,
  count,
  loading = false,
  error = null,
  onCancel,
  onDelete,
}: BrewingMethodDeleteDialogProps) {
  const inUse = method != null && count > 0;

  if (inUse) {
    return (
      <Dialog open onClose={onCancel}>
        <DialogTitle>Can&rsquo;t delete this method</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &ldquo;{method.method_name}&rdquo; is used by <b>{count} {count === 1 ? 'log' : 'logs'}</b>. Reassign or
            delete those logs first, then you can remove this method.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Got it</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <ConfirmDialog
      open={method != null}
      title={method ? `Delete "${method.method_name}"?` : ''}
      message="This removes the brewing method. This can't be undone."
      confirmLabel="Delete"
      loading={loading}
      error={error}
      onConfirm={onDelete}
      onCancel={onCancel}
    />
  );
}
