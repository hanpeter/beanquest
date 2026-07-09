import {
  AppBar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useWideLayout } from '../hooks/useWideLayout';

interface AppHeaderProps {
  scrolled: boolean;
  onDrawerOpen: () => void;
  searchOpen: boolean;
  query: string;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onQueryChange: (q: string) => void;
  activeCount: number;
  sortLabel: string;
  onFilterOpen: () => void;
  onSortOpen: () => void;
  summaryText: string;
  onClearAll: () => void;
}

export function AppHeader({
  scrolled,
  onDrawerOpen,
  searchOpen,
  query,
  onSearchOpen,
  onSearchClose,
  onQueryChange,
  activeCount,
  sortLabel,
  onFilterOpen,
  onSortOpen,
  summaryText,
  onClearAll,
}: AppHeaderProps) {
  const wide = useWideLayout();

  return (
    <AppBar
      position="sticky"
      elevation={scrolled ? 3 : 0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
        transition: 'box-shadow 150ms ease',
      }}
    >
      {/* Row 1: navigation bar */}
      <Toolbar sx={{ minHeight: 52, px: 1, gap: 0.5 }}>
        <IconButton onClick={onDrawerOpen} aria-label="Open menu" size="medium" sx={{ width: 40, height: 40 }}>
          <MenuIcon />
        </IconButton>

        {searchOpen ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
            <InputBase
              autoFocus
              fullWidth
              placeholder="Search beans…"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              inputProps={{ 'aria-label': 'Search beans' }}
              sx={{ fontSize: '0.9375rem' }}
            />
            <IconButton
              onClick={onSearchClose}
              aria-label="Close search"
              size="small"
              sx={{ width: 28, height: 28, flexShrink: 0 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
              <Typography variant="subtitle1" component="span" sx={{
                fontWeight: 700
              }}>
                BeanQuest
              </Typography>
              <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="subtitle1" component="span" sx={{
                color: "text.secondary"
              }}>
                Logs
              </Typography>
            </Box>
            {wide ? (
              <Button onClick={onSearchOpen} startIcon={<SearchIcon />} color="inherit" sx={{ textTransform: 'none' }}>
                Search
              </Button>
            ) : (
              <IconButton onClick={onSearchOpen} aria-label="Search" size="medium" sx={{ width: 40, height: 40 }}>
                <SearchIcon />
              </IconButton>
            )}
          </>
        )}
      </Toolbar>
      {/* Row 2: filter + sort toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          height: 44,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          component="button"
          onClick={onFilterOpen}
          aria-label={`Filter${activeCount > 0 ? `, ${activeCount} active` : ''}`}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'text.primary',
            typography: 'body2',
            fontWeight: 500,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <FilterListIcon sx={{ fontSize: 18 }} />
          <span>Filter</span>
          {activeCount > 0 && (
            <Badge
              badgeContent={activeCount}
              color="primary"
              sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none', ml: 0.25 } }}
            />
          )}
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box
          component="button"
          onClick={onSortOpen}
          aria-label={`Sort by ${sortLabel}`}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'text.primary',
            typography: 'body2',
            fontWeight: 500,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <SortIcon sx={{ fontSize: 18 }} />
          <span>Sort: {sortLabel}</span>
        </Box>
      </Box>
      {/* Row 3: applied-filters summary (only when ≥1 filter active) */}
      {activeCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 0.75,
            bgcolor: 'action.selected',
            borderTop: 1,
            borderColor: 'divider',
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: "text.secondary",
              flex: 1,
              minWidth: 0
            }}>
            {summaryText}
          </Typography>
          <Box
            component="button"
            onClick={onClearAll}
            sx={{
              border: 0,
              bgcolor: 'transparent',
              cursor: 'pointer',
              color: 'primary.main',
              typography: 'caption',
              fontWeight: 500,
              flexShrink: 0,
              p: 0,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Clear all
          </Box>
        </Box>
      )}
    </AppBar>
  );
}
