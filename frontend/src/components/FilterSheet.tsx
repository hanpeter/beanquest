import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { FilterPanel } from '../types';

interface FilterSheetProps {
  panel: FilterPanel | null;
  onNavigate: (panel: FilterPanel) => void;
  onClose: () => void;
  ratingMin: number | null;
  onRatingMin: (v: number | null) => void;
  procSel: string[];
  onProcSel: (v: string[]) => void;
  roastSel: string[];
  onRoastSel: (v: string[]) => void;
  brewSel: string[];
  onBrewSel: (v: string[]) => void;
  onClearAll: () => void;
  processOptions: string[];
  roastingOptions: string[];
  brewingOptions: string[];
}

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

function ratingCaption(ratingMin: number | null): string {
  if (ratingMin == null) return 'Any rating';
  if (ratingMin === 5) return 'Only 5';
  return `${ratingMin} & up`;
}

// ---------------------------------------------------------------------------
// Multi-select drill-in panel (Process / Roasting method / Brewing method)
// ---------------------------------------------------------------------------
interface MultiPanelProps {
  title: string;
  options: string[];
  sel: string[];
  onToggle: (v: string) => void;
  onBack: () => void;
}

function MultiPanel({ title, options, sel, onToggle, onBack }: MultiPanelProps) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, pt: 1.5 }}>
        <IconButton onClick={onBack} aria-label="Back" size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600} sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
        {options.map(o => (
          <ListItem key={o} disablePadding>
            <ListItemButton onClick={() => onToggle(o)} sx={{ px: 2, py: 0.75 }}>
              <ListItemText primary={o} />
              <Checkbox
                edge="end"
                checked={sel.includes(o)}
                tabIndex={-1}
                disableRipple
                size="small"
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button fullWidth variant="outlined" onClick={onBack}>
          Back
        </Button>
        <Button fullWidth variant="contained" onClick={onBack}>
          Done
        </Button>
      </Box>
    </>
  );
}

// ---------------------------------------------------------------------------
// Root filter panel
// ---------------------------------------------------------------------------
interface FilterRootProps {
  ratingMin: number | null;
  onRatingMin: (v: number | null) => void;
  procSel: string[];
  roastSel: string[];
  brewSel: string[];
  onNavigate: (panel: FilterPanel) => void;
  onClearAll: () => void;
  onClose: () => void;
}

function FilterRoot({
  ratingMin,
  onRatingMin,
  procSel,
  roastSel,
  brewSel,
  onNavigate,
  onClearAll,
  onClose,
}: FilterRootProps) {
  return (
    <>
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          Filter
        </Typography>

        {/* Rating — inline 0–5 boxes ("n & up") */}
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
          Rating
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
          {[0, 1, 2, 3, 4, 5].map(n => {
            const active = ratingMin != null && n >= ratingMin;
            return (
              <Box
                key={n}
                component="button"
                onClick={() => onRatingMin(ratingMin === n ? null : n)}
                aria-pressed={active}
                aria-label={`Rating ${n} and up`}
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid',
                  borderColor: active ? 'primary.main' : 'divider',
                  bgcolor: active ? 'primary.main' : 'transparent',
                  color: active ? 'primary.contrastText' : 'text.primary',
                  cursor: 'pointer',
                  borderRadius: 1,
                  typography: 'body2',
                  fontWeight: 500,
                  userSelect: 'none',
                  transition: 'background-color 120ms, border-color 120ms',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                {n}
              </Box>
            );
          })}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          {ratingCaption(ratingMin)}
        </Typography>

        <Divider sx={{ mb: 1 }} />

        {/* Process drill-in row */}
        <FilterRow
          label="Process"
          value={procSel.length ? procSel.join(', ') : 'Any'}
          active={procSel.length > 0}
          onClick={() => onNavigate('process')}
        />

        {/* Roasting method drill-in row */}
        <FilterRow
          label="Roasting method"
          value={roastSel.length ? `${roastSel.length} selected` : 'Any'}
          active={roastSel.length > 0}
          onClick={() => onNavigate('roasting')}
        />

        {/* Brewing method drill-in row */}
        <FilterRow
          label="Brewing method"
          value={brewSel.length ? `${brewSel.length} selected` : 'Any'}
          active={brewSel.length > 0}
          onClick={() => onNavigate('brewing')}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button fullWidth variant="outlined" onClick={onClearAll}>
          Clear all
        </Button>
        <Button fullWidth variant="contained" onClick={onClose}>
          Show results
        </Button>
      </Box>
    </>
  );
}

interface FilterRowProps {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}

function FilterRow({ label, value, active, onClick }: FilterRowProps) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        py: 1.25,
        px: 0,
        border: 0,
        bgcolor: 'transparent',
        cursor: 'pointer',
        borderBottom: 1,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Typography variant="body2">{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="body2"
          color={active ? 'primary.main' : 'text.secondary'}
          fontWeight={active ? 500 : 400}
        >
          {value}
        </Typography>
        <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// FilterSheet (orchestrates root + drill-in panels in a single Drawer)
// ---------------------------------------------------------------------------
export function FilterSheet({
  panel,
  onNavigate,
  onClose,
  ratingMin,
  onRatingMin,
  procSel,
  onProcSel,
  roastSel,
  onRoastSel,
  brewSel,
  onBrewSel,
  onClearAll,
  processOptions,
  roastingOptions,
  brewingOptions,
}: FilterSheetProps) {
  return (
    <Drawer
      anchor="bottom"
      open={panel !== null}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '84vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Grab handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0, flexShrink: 0 }}>
        <Box sx={{ width: 32, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
      </Box>

      {panel === 'filter' && (
        <FilterRoot
          ratingMin={ratingMin}
          onRatingMin={onRatingMin}
          procSel={procSel}
          roastSel={roastSel}
          brewSel={brewSel}
          onNavigate={onNavigate}
          onClearAll={onClearAll}
          onClose={onClose}
        />
      )}

      {panel === 'process' && (
        <MultiPanel
          title="Process"
          options={processOptions}
          sel={procSel}
          onToggle={v => onProcSel(toggle(procSel, v))}
          onBack={() => onNavigate('filter')}
        />
      )}

      {panel === 'roasting' && (
        <MultiPanel
          title="Roasting method"
          options={roastingOptions}
          sel={roastSel}
          onToggle={v => onRoastSel(toggle(roastSel, v))}
          onBack={() => onNavigate('filter')}
        />
      )}

      {panel === 'brewing' && (
        <MultiPanel
          title="Brewing method"
          options={brewingOptions}
          sel={brewSel}
          onToggle={v => onBrewSel(toggle(brewSel, v))}
          onBack={() => onNavigate('filter')}
        />
      )}
    </Drawer>
  );
}
