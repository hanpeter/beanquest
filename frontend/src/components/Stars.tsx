import { Box } from '@mui/material';

interface StarsProps {
  score: number;
}

export function Stars({ score }: StarsProps) {
  return (
    <Box component="span" sx={{ fontFamily: 'monospace', letterSpacing: 0.5, userSelect: 'none' }}>
      <Box component="span" sx={{ color: 'warning.main' }}>
        {score > 0 ? '★'.repeat(score) : '·'}
      </Box>
      <Box component="span" sx={{ color: 'text.disabled' }}>
        {'☆'.repeat(5 - score)}
      </Box>
    </Box>
  );
}
