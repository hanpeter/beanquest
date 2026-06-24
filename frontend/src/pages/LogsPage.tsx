import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Container, Typography } from '@mui/material';
import { getPastLogs, getRoastingMethods, getBrewingMethods } from '../api';
import type { FilterPanel, Filters, PastLog, RoastingMethod, BrewingMethod, SortKey } from '../types';
import { SORT_LABEL } from '../constants';
import {
  activeCount,
  distinctProcesses,
  filterLogs,
  groupByBean,
  sortLogs,
  summaryParts,
} from '../logic/logs';
import { useScrolled } from '../hooks/useScrolled';
import { AppHeader } from '../components/AppHeader';
import { LogEntry } from '../components/LogEntry';
import { NavDrawer } from '../components/NavDrawer';
import { FilterSheet } from '../components/FilterSheet';
import { SortSheet } from '../components/SortSheet';

export function LogsPage() {
  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const [logs, setLogs] = useState<PastLog[]>([]);
  const [roastingMethods, setRoastingMethods] = useState<RoastingMethod[]>([]);
  const [brewingMethods, setBrewingMethods] = useState<BrewingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    Promise.all([getPastLogs(), getRoastingMethods(), getBrewingMethods()])
      .then(([pastLogs, roasting, brewing]) => {
        if (ignore) return;
        setLogs(pastLogs ?? []);
        setRoastingMethods(roasting ?? []);
        setBrewingMethods(brewing ?? []);
      })
      .catch(err => {
        if (!ignore) setError((err as Error).message ?? 'Failed to load data');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterPanel, setFilterPanel] = useState<FilterPanel | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  // Filter state
  const [ratingMin, setRatingMin] = useState<number | null>(null);
  const [procSel, setProcSel] = useState<string[]>([]);
  const [roastSel, setRoastSel] = useState<string[]>([]);
  const [brewSel, setBrewSel] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('date-desc');

  const scrolled = useScrolled();

  const clearAll = useCallback(() => {
    setRatingMin(null);
    setProcSel([]);
    setRoastSel([]);
    setBrewSel([]);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const filters: Filters = { ratingMin, procSel, roastSel, brewSel, query };

  const beans = useMemo(
    () => groupByBean(sortLogs(filterLogs(logs, filters), sort)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs, ratingMin, procSel, roastSel, brewSel, query, sort],
  );

  const processOptions = useMemo(() => distinctProcesses(logs), [logs]);
  const roastingOptions = useMemo(() => roastingMethods.map(r => r.roaster_name), [roastingMethods]);
  const brewingOptions = useMemo(() => brewingMethods.map(b => b.method_name), [brewingMethods]);

  const count = activeCount(filters);
  const summary = summaryParts(filters).join(' · ');
  const sortLabel = SORT_LABEL[sort];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader
        scrolled={scrolled}
        onDrawerOpen={() => setDrawer(true)}
        searchOpen={searchOpen}
        query={query}
        onSearchOpen={() => setSearchOpen(true)}
        onSearchClose={handleSearchClose}
        onQueryChange={setQuery}
        activeCount={count}
        sortLabel={sortLabel}
        onFilterOpen={() => setFilterPanel('filter')}
        onSortOpen={() => setSortOpen(true)}
        summaryText={summary}
        onClearAll={clearAll}
      />

      <Container
        maxWidth={false}
        sx={{ maxWidth: 460, px: 0 }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        )}

        {error && !loading && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && !error && beans.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 8, gap: 1, px: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No logs match
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Try clearing a filter or searching another bean.
            </Typography>
          </Box>
        )}

        {!loading && !error && beans.map(group => (
          <Box key={group.bean}>
            {/* Bean header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                pt: 2,
                pb: 0.75,
              }}
            >
              <Typography variant="h6" component="h2" sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {group.bean}
              </Typography>
              <Chip
                label={group.process}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem', borderRadius: 1 }}
              />
            </Box>

            {/* Log rows */}
            {group.logs.map(log => (
              <LogEntry
                key={log.id}
                log={log}
                onClick={() => {
                  // navigate to detail page — not built in this sprint
                }}
              />
            ))}
          </Box>
        ))}
      </Container>

      {/* Overlays */}
      <NavDrawer open={drawer} onClose={() => setDrawer(false)} />

      <FilterSheet
        panel={filterPanel}
        onNavigate={setFilterPanel}
        onClose={() => setFilterPanel(null)}
        ratingMin={ratingMin}
        onRatingMin={setRatingMin}
        procSel={procSel}
        onProcSel={setProcSel}
        roastSel={roastSel}
        onRoastSel={setRoastSel}
        brewSel={brewSel}
        onBrewSel={setBrewSel}
        onClearAll={clearAll}
        processOptions={processOptions}
        roastingOptions={roastingOptions}
        brewingOptions={brewingOptions}
      />

      <SortSheet
        open={sortOpen}
        sort={sort}
        onSort={setSort}
        onClose={() => setSortOpen(false)}
      />
    </Box>
  );
}
