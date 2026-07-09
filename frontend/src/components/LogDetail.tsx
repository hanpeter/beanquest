import { Box, Chip, Dialog, Divider, IconButton, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import NotesIcon from '@mui/icons-material/Notes';
import ReplayIcon from '@mui/icons-material/Replay';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { PastLog } from '../types';
import { fmtLong } from '../logic/logs';
import { Stars } from './Stars';
import { useWideLayout } from '../hooks/useWideLayout';
import { CONTENT_MAX_WIDTH } from '../constants';

interface LogDetailProps {
  log: PastLog;
  siblings: PastLog[];
  onBack: () => void;
  onOpenSibling: (id: number) => void;
  onBrewAgain: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

const sectionIconSx = { fontSize: 18, color: 'text.secondary' };

export function LogDetail({ log, siblings, onBack, onOpenSibling, onBrewAgain, onEdit, onDelete }: LogDetailProps) {
  const wide = useWideLayout();

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
          Logs
        </Box>
        <Box sx={{ flex: 1 }} />
        {wide ? (
          <>
            <Button onClick={onBrewAgain} startIcon={<ReplayIcon />} color="inherit" title="Brew again" sx={{ textTransform: 'none' }}>
              Brew again
            </Button>
            <Button onClick={onEdit} startIcon={<EditIcon />} color="inherit" title="Edit" sx={{ textTransform: 'none' }}>
              Edit
            </Button>
            <Button onClick={onDelete} startIcon={<DeleteIcon />} color="inherit" title="Delete" sx={{ textTransform: 'none' }}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <IconButton onClick={onBrewAgain} aria-label="Brew again" title="Brew again">
              <ReplayIcon />
            </IconButton>
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
          <Typography variant="h5" fontWeight={700}>
            {log.bean_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
            <Chip label={log.process} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            <Stars score={log.rating_score} />
            <Typography variant="body2" color="text.secondary">
              · {fmtLong(log.date_logged)}
            </Typography>
          </Box>
        </Box>

        <Section icon={<LocalFireDepartmentIcon sx={sectionIconSx} />} title="Roast">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: log.roasting_notes ? 1 : 0 }}>
            <Typography variant="body2" color="text.secondary">
              Roaster
            </Typography>
            <Typography variant="body2">{log.roasting_method_name}</Typography>
          </Box>
          {log.roasting_notes && <Typography variant="body2">{log.roasting_notes}</Typography>}
        </Section>

        <Section icon={<LocalCafeIcon sx={sectionIconSx} />} title="Brew">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Method
            </Typography>
            <Typography variant="body2">{log.brewing_method_name}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Grinder
            </Typography>
            <Typography variant="body2">{log.grinder_setting || '—'}</Typography>
          </Box>
        </Section>

        {log.general_notes && (
          <Section icon={<NotesIcon sx={sectionIconSx} />} title="Tasting notes">
            <Typography variant="body2">{log.general_notes}</Typography>
          </Section>
        )}

        {siblings.length > 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Other brews of this bean
            </Typography>
            {siblings.map((s, i) => (
              <Box key={s.id}>
                <Box
                  onClick={() => onOpenSibling(s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenSibling(s.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      {s.brewing_method_name} · {s.grinder_setting}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fmtLong(s.date_logged)}
                    </Typography>
                  </Box>
                  <Stars score={s.rating_score} />
                </Box>
                {i < siblings.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      </Box>
    </Dialog>
  );
}
