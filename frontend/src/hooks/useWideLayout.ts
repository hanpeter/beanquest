import { useMediaQuery, useTheme } from '@mui/material';

/** True on screens wider than the "medium" breakpoint (≥ md / 900px). */
export function useWideLayout(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('md'));
}
