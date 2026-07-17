import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoasting = location.pathname === '/roasting-methods';
  const isBrewing = location.pathname === '/brewing-methods';
  const isLogs = !isRoasting && !isBrewing;

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '80vw', sm: 320 }, maxWidth: 320 } }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
        }}
      >
        <Typography variant="h6">BeanQuest</Typography>
        <IconButton onClick={onClose} aria-label="Close menu" size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ px: 1 }}>
        <ListItemButton selected={isLogs} onClick={() => go('/logs')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <MenuBookIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logs" />
        </ListItemButton>
        <ListItemButton selected={isRoasting} onClick={() => go('/roasting-methods')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LocalFireDepartmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Roasting Methods" />
        </ListItemButton>
        <ListItemButton selected={isBrewing} onClick={() => go('/brewing-methods')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LocalCafeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Brewing Methods" />
        </ListItemButton>
        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
        <ListItemButton onClick={onClose}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SmartToyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Ask the AI" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
