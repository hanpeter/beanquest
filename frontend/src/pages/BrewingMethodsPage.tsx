import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, CircularProgress, Container, Fab, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  getBrewingMethods,
  getPastLogs,
  createBrewingMethod,
  updateBrewingMethod,
  deleteBrewingMethod,
} from '../api';
import type { BrewingMethod, BrewingMethodFormState, BrewingMethodInput, BrewingSortKey, PastLog } from '../types';
import { BREWING_SORT_LABEL, BREWING_SORT_OPTIONS, CONTENT_MAX_WIDTH, CONTENT_WIDTH_PCT } from '../constants';
import { filterMethods, lastUsed, sortMethods, usageCounts } from '../logic/brewingMethods';
import { useScrolled } from '../hooks/useScrolled';
import { useWideLayout } from '../hooks/useWideLayout';
import { AppHeader } from '../components/AppHeader';
import { NavDrawer } from '../components/NavDrawer';
import { SortSheet } from '../components/SortSheet';
import { BrewingMethodEntry } from '../components/BrewingMethodEntry';
import { BrewingMethodDetail } from '../components/BrewingMethodDetail';
import { BrewingMethodForm } from '../components/BrewingMethodForm';
import { BrewingMethodDeleteDialog } from '../components/BrewingMethodDeleteDialog';

// FAB `right` offset, derived from CONTENT_WIDTH_PCT so the two can't drift apart.
const FAB_RIGHT = Object.fromEntries(
  Object.entries(CONTENT_WIDTH_PCT).map(([bp, pct]) => {
    const gapVw = (100 - pct) / 2;
    return [bp, `max(24px, calc(${gapVw}vw + 24px))`];
  }),
) as Record<keyof typeof CONTENT_WIDTH_PCT, string>;

export function BrewingMethodsPage() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const [methods, setMethods] = useState<BrewingMethod[]>([]);
  const [logs, setLogs] = useState<PastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    Promise.all([getBrewingMethods(), getPastLogs()])
      .then(([brewing, pastLogs]) => {
        if (ignore) return;
        setMethods(brewing ?? []);
        setLogs(pastLogs ?? []);
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
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<BrewingSortKey>('name-asc');

  const [detailId, setDetailId] = useState<number | null>(null);
  const [form, setForm] = useState<BrewingMethodFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const scrolled = useScrolled();
  const wide = useWideLayout();

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  const openForm = useCallback((state: BrewingMethodFormState) => {
    setSaveError(null);
    setForm(state);
  }, []);

  const openNew = useCallback(() => {
    openForm({ title: 'New brewing method', editId: null, seed: {} });
  }, [openForm]);

  const openEdit = useCallback((method: BrewingMethod) => {
    openForm({
      title: 'Edit brewing method',
      editId: method.id,
      seed: { method_name: method.method_name, machine_used: method.machine_used, grinder_used: method.grinder_used },
    });
  }, [openForm]);

  const handleSave = useCallback((input: BrewingMethodInput) => {
    const editId = form?.editId ?? null;
    setSaving(true);
    setSaveError(null);
    const request = editId != null ? updateBrewingMethod(editId, input) : createBrewingMethod(input);
    request
      .then(saved => {
        if (!saved) return;
        setMethods(prev => (editId != null ? prev.map(m => (m.id === saved.id ? saved : m)) : [saved, ...prev]));
        setForm(null);
      })
      .catch(err => setSaveError((err as Error).message ?? 'Failed to save brewing method'))
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
    deleteBrewingMethod(id)
      .then(() => {
        setMethods(prev => prev.filter(m => m.id !== id));
        setPendingDeleteId(null);
        setDetailId(null);
      })
      .catch(err => setDeleteError((err as Error).message ?? 'Failed to delete brewing method'))
      .finally(() => setDeleting(false));
  }, [pendingDeleteId]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const counts = useMemo(() => usageCounts(logs), [logs]);

  const rows = useMemo(
    () => sortMethods(filterMethods(methods, query), sort, counts),
    [methods, query, sort, counts],
  );

  const sortLabel = BREWING_SORT_LABEL[sort];

  const detailMethod = methods.find(m => m.id === detailId) ?? null;
  const detailCount = detailMethod ? (counts.get(detailMethod.id) ?? 0) : 0;
  const detailLastUsed = detailMethod ? lastUsed(logs, detailMethod.id) : null;

  const pendingDeleteMethod = methods.find(m => m.id === pendingDeleteId) ?? null;
  const pendingDeleteCount = pendingDeleteMethod ? (counts.get(pendingDeleteMethod.id) ?? 0) : 0;

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
        sortLabel={sortLabel}
        onSortOpen={() => setSortOpen(true)}
        breadcrumbLabel="Brewing Methods"
        searchPlaceholder="Search methods…"
      />
      <Container maxWidth={false} sx={{ maxWidth: CONTENT_MAX_WIDTH, px: 0 }}>
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

        {!loading && !error && rows.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 8, gap: 1, px: 4 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              {query ? 'No methods match' : 'No brewing methods yet'}
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
              {query ? 'Try another search.' : 'Add the first way you brew your coffee.'}
            </Typography>
          </Box>
        )}

        {!loading && !error && rows.map(method => (
          <BrewingMethodEntry
            key={method.id}
            method={method}
            count={counts.get(method.id) ?? 0}
            onClick={() => setDetailId(method.id)}
          />
        ))}
      </Container>
      {/* Add-method entry point — hidden while the form or detail panel is open */}
      {!form && !detailMethod && (
        <Fab
          color="primary"
          variant={wide ? 'extended' : 'circular'}
          aria-label="New brewing method"
          onClick={openNew}
          sx={{ position: 'fixed', bottom: 24, right: FAB_RIGHT }}
        >
          <AddIcon sx={{ mr: wide ? 1 : 0 }} />
          {wide && 'New method'}
        </Fab>
      )}
      {/* Overlays */}
      <NavDrawer open={drawer} onClose={() => setDrawer(false)} />
      <SortSheet open={sortOpen} sort={sort} onSort={setSort} onClose={() => setSortOpen(false)} options={BREWING_SORT_OPTIONS} />
      {detailMethod && (
        <BrewingMethodDetail
          method={detailMethod}
          count={detailCount}
          lastUsed={detailLastUsed}
          onBack={() => setDetailId(null)}
          onEdit={() => openEdit(detailMethod)}
          onDelete={() => openDeleteConfirm(detailMethod.id)}
          onUsage={() => navigate(`/logs?brewing=${encodeURIComponent(detailMethod.method_name)}`)}
        />
      )}
      {form && (
        <BrewingMethodForm
          title={form.title}
          seed={form.seed}
          existing={methods}
          editId={form.editId}
          saving={saving}
          error={saveError}
          onCancel={() => setForm(null)}
          onSave={handleSave}
        />
      )}
      <BrewingMethodDeleteDialog
        method={pendingDeleteMethod}
        count={pendingDeleteCount}
        loading={deleting}
        error={deleteError}
        onCancel={() => setPendingDeleteId(null)}
        onDelete={handleDelete}
      />
    </Box>
  );
}
