import { Box, Divider, Typography } from '@mui/material';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import SettingsIcon from '@mui/icons-material/Settings';
import type { BrewingMethod } from '../types';

interface BrewingMethodEntryProps {
  method: BrewingMethod;
  count: number;
  onClick: () => void;
}

const facetIconSx = { fontSize: 14, color: 'text.secondary', flexShrink: 0, mt: '2px' };

export function BrewingMethodEntry({ method, count, onClick }: BrewingMethodEntryProps) {
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
          <Typography variant="body1">{method.method_name}</Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {count} {count === 1 ? 'log' : 'logs'}
          </Typography>
        </Box>

        {/* Line 2: machine — truncated to 1 line */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
          <LocalCafeIcon sx={facetIconSx} />
          <Typography
            variant="body2"
            className="line-clamp-1"
            title={method.machine_used || 'No machine set'}
            sx={{
              color: 'text.secondary',
              fontStyle: method.machine_used ? 'italic' : 'normal',
            }}
          >
            {method.machine_used || 'No machine set'}
          </Typography>
        </Box>

        {/* Line 3: grinder — truncated to 1 line */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 0.5 }}>
          <SettingsIcon sx={facetIconSx} />
          <Typography
            variant="body2"
            className="line-clamp-1"
            title={method.grinder_used || 'No grinder set'}
            sx={{
              color: 'text.secondary',
              fontStyle: method.grinder_used ? 'italic' : 'normal',
            }}
          >
            {method.grinder_used || 'No grinder set'}
          </Typography>
        </Box>
      </Box>
      <Divider />
    </>
  );
}
