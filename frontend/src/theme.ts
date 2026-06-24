import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A2517',
      light: '#7A4030',
      dark: '#2C1509',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C97C30',
      light: '#E09A52',
      dark: '#9A5C1C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAF8F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1713',
      secondary: '#6B6560',
    },
    divider: '#E8E4DF',
    warning: {
      main: '#E8A838',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FAF8F5',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1C1713',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: '#FAF0EA',
            color: '#4A2517',
            '& .MuiListItemIcon-root': {
              color: '#4A2517',
            },
            '&:hover': {
              backgroundColor: '#F5E8E0',
            },
          },
        },
      },
    },
  },
});

export default theme;
