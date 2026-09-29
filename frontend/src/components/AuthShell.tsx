import { Box, Chip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import type { ReactNode } from 'react';
import { CONTENT_MAX_WIDTH } from '../constants';

interface AuthShellProps {
  onBack?: () => void;
  contextBar?: string;
  children: ReactNode;
}

/** Centered mobile column shared by every auth screen: optional Back row, the
 * BeanQuest wordmark, an optional context bar (design screen 7's "Redirected
 * from …"), then the screen's own content. */
export function AuthShell({ onBack, contextBar, children }: AuthShellProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', mx: 'auto', px: 2, py: 3, flex: 1 }}>
        {onBack && (
          <Box
            component="button"
            type="button"
            onClick={onBack}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              border: 0,
              bgcolor: 'transparent',
              cursor: 'pointer',
              color: 'text.primary',
              typography: 'body1',
              p: 0,
              mb: 1,
            }}
          >
            <ChevronLeftIcon fontSize="small" />
            Back
          </Box>
        )}
        <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}>
          BeanQuest
        </Typography>
        {contextBar && (
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              px: 1.5,
              py: 1,
              mb: 2,
              typography: 'body2',
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            {contextBar}
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
}

interface SoonButtonProps {
  icon: ReactNode;
  label: string;
}

/** A real button that does nothing — present, positioned, and labelled "Soon" so
 * enabling Google/magic-link later is a behavior change, not a redesign. Kept in
 * tab order via aria-disabled rather than the disabled attribute. */
export function SoonButton({ icon, label }: SoonButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      aria-disabled="true"
      onClick={e => e.preventDefault()}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'transparent',
        color: 'text.disabled',
        cursor: 'default',
        px: 2,
        py: 1.25,
        typography: 'body2',
        mt: 1,
        '&:hover': { bgcolor: 'transparent' },
      }}
    >
      {icon}
      <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
        {label}
      </Box>
      <Chip label="Soon" size="small" sx={{ bgcolor: 'action.selected', color: 'text.secondary' }} />
    </Box>
  );
}
