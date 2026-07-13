import { Box, Dialog, IconButton, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import NotesIcon from '@mui/icons-material/Notes';
import type { RoastingMethod } from '../types';
import { fmtLong } from '../logic/logs';
import { useWideLayout } from '../hooks/useWideLayout';
import { CONTENT_MAX_WIDTH } from '../constants';

interface RoastingMethodDetailProps {
  method: RoastingMethod;
  count: number;
  lastUsed: string | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUsage: () => void;
}

const sectionIconSx = { fontSize: 18, color: 'text.secondary' };

export function RoastingMethodDetail({
  method,
  count,
  lastUsed,
  onBack,
  onEdit,
  onDelete,
  onUsage,
}: RoastingMethodDetailProps) {
  const wide = useWideLayout();
  const logWord = count === 1 ? 'log' : 'logs';

  return (
    <Dialog fullScreen open onClose={onBack}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          component="button"
          onClick={onBack}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            typography: 'body1',
            color: 'text.primary',
          }}
        >
          <ArrowBackIcon fontSize="small" />
          Roasting Methods
        </Box>
        <Box sx={{ flex: 1 }} />
        {wide ? (
          <>
            <Button onClick={onEdit} startIcon={<EditIcon />} color="inherit" title="Edit" sx={{ textTransform: 'none' }}>
              Edit
            </Button>
            <Button onClick={onDelete} startIcon={<DeleteIcon />} color="inherit" title="Delete" sx={{ textTransform: 'none' }}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <IconButton onClick={onEdit} aria-label="Edit" title="Edit">
              <EditIcon />
            </IconButton>
            <IconButton onClick={onDelete} aria-label="Delete" title="Delete">
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="h5" sx={{
              fontWeight: 700
            }}>
              {method.roaster_name}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              mt: 0.75
            }}>
              {count} {logWord}
            </Typography>
          </Box>

          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <NotesIcon sx={sectionIconSx} />
              <Typography variant="subtitle2" sx={{
                fontWeight: 600
              }}>
                Description
              </Typography>
            </Box>
            {method.description ? (
              <Typography variant="body2">{method.description}</Typography>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No description yet — tap edit to add build notes or technique.
              </Typography>
            )}
          </Box>

          <Box
            onClick={onUsage}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onUsage()}
            sx={{ px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <LocalFireDepartmentIcon sx={sectionIconSx} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                Usage
              </Typography>
              <ChevronRightIcon sx={sectionIconSx} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                In logs
              </Typography>
              <Typography variant="body2">{count} {count === 1 ? 'brew log' : 'brew logs'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                Last used
              </Typography>
              <Typography variant="body2">{lastUsed ? fmtLong(lastUsed) : 'Never'}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'primary.main' }}>
              See these logs
            </Typography>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
