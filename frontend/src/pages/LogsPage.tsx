import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Container, Fab, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  getPastLogs,
  getRoastingMethods,
  getBrewingMethods,
  createPastLog,
  updatePastLog,
  deletePastLog,
} from '../api';
import type {
  FilterPanel,
  Filters,
  LogFormState,
  PastLog,
  PastLogInput,
  RoastingMethod,
  BrewingMethod,
  SortKey,
} from '../types';
import { SORT_LABEL } from '../constants';
import {
  activeCount,
  distinctBeans,
  distinctProcesses,
  filterLogs,
  groupByBean,
  siblingLogs,
  sortLogs,
  summaryParts,
} from '../logic/logs';
import { useScrolled } from '../hooks/useScrolled';
import { AppHeader } from '../components/AppHeader';
import { LogEntry } from '../components/LogEntry';
import { NavDrawer } from '../components/NavDrawer';
import { FilterSheet } from '../components/FilterSheet';
import { SortSheet } from '../components/SortSheet';
import { LogForm } from '../components/LogForm';
import { LogDetail } from '../components/LogDetail';
import { ConfirmDialog } from '../components/ConfirmDialog';

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

  // Detail / form state
  const [detailId, setDetailId] = useState<number | null>(null);
  const [form, setForm] = useState<LogFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openForm = useCallback((state: LogFormState) => {
    setSaveError(null);
    setForm(state);
  }, []);

  const openEdit = useCallback((log: PastLog) => {
    openForm({
      title: 'Edit log',
      editId: log.id,
      seed: {
        bean_name: log.bean_name,
        process: log.process,
        roasting_method_id: log.roasting_method_id,
        roasting_notes: log.roasting_notes,
        brewing_method_id: log.brewing_method_id,
        grinder_setting: log.grinder_setting,
        rating_score: log.rating_score,
        general_notes: log.general_notes,
        date_logged: log.date_logged.split('T')[0],
      },
    });
  }, [openForm]);

  const openBrewAgain = useCallback((log: PastLog) => {
    openForm({
      title: 'New log',
      editId: null,
      seed: {
        bean_name: log.bean_name,
        process: log.process,
        roasting_method_id: log.roasting_method_id,
        roasting_notes: log.roasting_notes,
      },
    });
  }, [openForm]);

  const handleSave = useCallback((input: PastLogInput) => {
    const editId = form?.editId ?? null;
    setSaving(true);
    setSaveError(null);
    const request = editId != null ? updatePastLog(editId, input) : createPastLog(input);
    request
      .then(saved => {
        if (!saved) return;
        setLogs(prev => (editId != null ? prev.map(l => (l.id === saved.id ? saved : l)) : [saved, ...prev]));
        setForm(null);
      })
      .catch(err => setSaveError((err as Error).message ?? 'Failed to save log'))
      .finally(() => setSaving(false));
  }, [form]);

  const openDeleteConfirm = useCallback((id: number) => {
    setDeleteError(null);
    setPendingDeleteId(id);
  }, []);

  const handleDelete = useCallback(() => {
    if (pendingDeleteId == null) return;
    const id = pendingDeleteId;
    setDeleting(true);
    setDeleteError(null);
    deletePastLog(id)
      .then(() => {
        setLogs(prev => prev.filter(l => l.id !== id));
        setPendingDeleteId(null);
        setDetailId(null);
      })
      .catch(err => setDeleteError((err as Error).message ?? 'Failed to delete log'))
      .finally(() => setDeleting(false));
  }, [pendingDeleteId]);

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
  const knownBeans = useMemo(() => distinctBeans(logs), [logs]);

  const count = activeCount(filters);
  const summary = summaryParts(filters).join(' · ');
  const sortLabel = SORT_LABEL[sort];

  const detailLog = logs.find(l => l.id === detailId) ?? null;
  const siblings = detailLog ? siblingLogs(logs, detailLog) : [];

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
                onClick={() => setDetailId(log.id)}
              />
            ))}
          </Box>
        ))}
      </Container>

      {/* Add-log entry point — hidden while the form or detail panel is open */}
      {!form && !detailLog && (
        <Fab
          color="primary"
          aria-label="New log"
          onClick={() => openForm({ title: 'New log', editId: null, seed: {} })}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 'max(24px, calc((100vw - 460px) / 2 + 24px))',
          }}
        >
          <AddIcon />
        </Fab>
      )}

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

      {detailLog && (
        <LogDetail
          log={detailLog}
          siblings={siblings}
          onBack={() => setDetailId(null)}
          onOpenSibling={id => setDetailId(id)}
          onBrewAgain={() => openBrewAgain(detailLog)}
          onEdit={() => openEdit(detailLog)}
          onDelete={() => openDeleteConfirm(detailLog.id)}
        />
      )}

      {form && (
        <LogForm
          title={form.title}
          seed={form.seed}
          knownBeans={knownBeans}
          processOptions={processOptions}
          roastingMethods={roastingMethods}
          brewingMethods={brewingMethods}
          saving={saving}
          error={saveError}
          onCancel={() => setForm(null)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Delete this log?"
        message="This can't be undone."
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </Box>
  );
}
