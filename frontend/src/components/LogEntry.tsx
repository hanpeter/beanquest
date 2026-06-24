import { Box, Divider, Typography } from '@mui/material';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import NotesIcon from '@mui/icons-material/Notes';
import type { PastLog } from '../types';
import { fmtDate } from '../logic/logs';
import { Stars } from './Stars';

interface LogEntryProps {
  log: PastLog;
  onClick: () => void;
}

const facetIconSx = { fontSize: 14, color: 'text.secondary', flexShrink: 0, mt: '2px' };

export function LogEntry({ log, onClick }: LogEntryProps) {
  return (
    <>
      <Box
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
        sx={{
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
        }}
      >
        {/* Line 1: rating + date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Stars score={log.rating_score} />
          <Typography variant="caption" color="text.secondary">
            {fmtDate(log.date_logged)}
          </Typography>
        </Box>

        {/* Line 2: roast — truncated to 1 line */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 0.25 }}>
          <LocalFireDepartmentIcon sx={facetIconSx} />
          <Typography
            variant="body2"
            color="text.secondary"
            className="line-clamp-1"
            title={`${log.roasting_method_name} · ${log.roasting_notes}`}
          >
            {log.roasting_method_name} · {log.roasting_notes}
          </Typography>
        </Box>

        {/* Line 3: brew */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 0.25 }}>
          <LocalCafeIcon sx={facetIconSx} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {log.brewing_method_name} · {log.grinder_setting}
          </Typography>
        </Box>

        {/* Line 4: general notes — italic, truncated to 1 line */}
        {log.general_notes && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
            <NotesIcon sx={facetIconSx} />
            <Typography
              variant="body2"
              color="text.secondary"
              className="line-clamp-1"
              title={log.general_notes}
              sx={{ fontStyle: 'italic' }}
            >
              {log.general_notes}
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />
    </>
  );
}
