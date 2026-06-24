import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { SORT_OPTIONS } from '../constants';
import type { SortKey } from '../types';

interface SortSheetProps {
  open: boolean;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onClose: () => void;
}

export function SortSheet({ open, sort, onSort, onClose }: SortSheetProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
      }}
    >
      {/* Grab handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 32, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
      </Box>

      <Typography variant="subtitle1" fontWeight={600} sx={{ px: 2, pt: 1, pb: 0.5 }}>
        Sort by
      </Typography>

      <List disablePadding sx={{ pb: 2 }}>
        {SORT_OPTIONS.map(({ key, label }) => (
          <ListItemButton
            key={key}
            onClick={() => { onSort(key); onClose(); }}
            sx={{ px: 2, py: 1.25 }}
          >
            <ListItemText primary={label} primaryTypographyProps={{ variant: 'body1' }} />
            {sort === key && <CheckIcon fontSize="small" sx={{ color: 'primary.main', ml: 1 }} />}
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
