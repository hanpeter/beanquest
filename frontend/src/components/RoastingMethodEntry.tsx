import { Box, Divider, Typography } from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import type { RoastingMethod } from '../types';

interface RoastingMethodEntryProps {
  method: RoastingMethod;
  count: number;
  onClick: () => void;
}

const facetIconSx = { fontSize: 14, color: 'text.secondary', flexShrink: 0, mt: '2px' };

export function RoastingMethodEntry({ method, count, onClick }: RoastingMethodEntryProps) {
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
        {/* Line 1: name + usage count, same treatment as a Logs row's date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body1">{method.roaster_name}</Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {count} {count === 1 ? 'log' : 'logs'}
          </Typography>
        </Box>

        {/* Line 2: description — truncated to 1 line */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
          <NotesIcon sx={facetIconSx} />
          <Typography
            variant="body2"
            className="line-clamp-1"
            title={method.description || 'No description yet'}
            sx={{
              color: 'text.secondary',
              fontStyle: method.description ? 'italic' : 'normal',
            }}
          >
            {method.description || 'No description yet'}
          </Typography>
        </Box>
      </Box>
      <Divider />
    </>
  );
}
