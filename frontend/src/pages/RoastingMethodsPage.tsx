import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, CircularProgress, Container, Fab, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  getRoastingMethods,
  getPastLogs,
  createRoastingMethod,
  updateRoastingMethod,
  deleteRoastingMethod,
} from '../api';
import type { PastLog, RoastingMethod, RoastingMethodFormState, RoastingMethodInput, RoastingSortKey } from '../types';
import { ROASTING_SORT_LABEL, ROASTING_SORT_OPTIONS, CONTENT_MAX_WIDTH, CONTENT_WIDTH_PCT } from '../constants';
import { filterMethods, lastUsed, sortMethods, usageCounts } from '../logic/roastingMethods';
import { useScrolled } from '../hooks/useScrolled';
import { useWideLayout } from '../hooks/useWideLayout';
import { AppHeader } from '../components/AppHeader';
import { NavDrawer } from '../components/NavDrawer';
import { SortSheet } from '../components/SortSheet';
import { RoastingMethodEntry } from '../components/RoastingMethodEntry';
import { RoastingMethodDetail } from '../components/RoastingMethodDetail';
import { RoastingMethodForm } from '../components/RoastingMethodForm';
import { RoastingMethodDeleteDialog } from '../components/RoastingMethodDeleteDialog';

// FAB `right` offset, derived from CONTENT_WIDTH_PCT so the two can't drift apart.
const FAB_RIGHT = Object.fromEntries(
  Object.entries(CONTENT_WIDTH_PCT).map(([bp, pct]) => {
    const gapVw = (100 - pct) / 2;
    return [bp, `max(24px, calc(${gapVw}vw + 24px))`];
  }),
) as Record<keyof typeof CONTENT_WIDTH_PCT, string>;

export function RoastingMethodsPage() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const [methods, setMethods] = useState<RoastingMethod[]>([]);
  const [logs, setLogs] = useState<PastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    Promise.all([getRoastingMethods(), getPastLogs()])
      .then(([roasting, pastLogs]) => {
        if (ignore) return;
        setMethods(roasting ?? []);
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
  const [sort, setSort] = useState<RoastingSortKey>('name-asc');

  const [detailId, setDetailId] = useState<number | null>(null);
  const [form, setForm] = useState<RoastingMethodFormState | null>(null);
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

  const openForm = useCallback((state: RoastingMethodFormState) => {
    setSaveError(null);
    setForm(state);
  }, []);

  const openNew = useCallback(() => {
    openForm({ title: 'New roasting method', editId: null, seed: {} });
  }, [openForm]);

  const openEdit = useCallback((method: RoastingMethod) => {
    openForm({
      title: 'Edit roasting method',
      editId: method.id,
      seed: { roaster_name: method.roaster_name, description: method.description },
    });
  }, [openForm]);

  const handleSave = useCallback((input: RoastingMethodInput) => {
    const editId = form?.editId ?? null;
    setSaving(true);
    setSaveError(null);
    const request = editId != null ? updateRoastingMethod(editId, input) : createRoastingMethod(input);
    request
      .then(saved => {
        if (!saved) return;
        setMethods(prev => (editId != null ? prev.map(m => (m.id === saved.id ? saved : m)) : [saved, ...prev]));
        setForm(null);
      })
      .catch(err => setSaveError((err as Error).message ?? 'Failed to save roasting method'))
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
    deleteRoastingMethod(id)
      .then(() => {
        setMethods(prev => prev.filter(m => m.id !== id));
        setPendingDeleteId(null);
        setDetailId(null);
      })
      .catch(err => setDeleteError((err as Error).message ?? 'Failed to delete roasting method'))
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

  const sortLabel = ROASTING_SORT_LABEL[sort];

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
        breadcrumbLabel="Roasting Methods"
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
              {query ? 'No methods match' : 'No roasting methods yet'}
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
              {query ? 'Try another search.' : 'Add the first way you roast your beans.'}
            </Typography>
          </Box>
        )}

        {!loading && !error && rows.map(method => (
          <RoastingMethodEntry
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
          aria-label="New roasting method"
          onClick={openNew}
          sx={{ position: 'fixed', bottom: 24, right: FAB_RIGHT }}
        >
          <AddIcon sx={{ mr: wide ? 1 : 0 }} />
          {wide && 'New method'}
        </Fab>
      )}
      {/* Overlays */}
      <NavDrawer open={drawer} onClose={() => setDrawer(false)} />
      <SortSheet open={sortOpen} sort={sort} onSort={setSort} onClose={() => setSortOpen(false)} options={ROASTING_SORT_OPTIONS} />
      {detailMethod && (
        <RoastingMethodDetail
          method={detailMethod}
          count={detailCount}
          lastUsed={detailLastUsed}
          onBack={() => setDetailId(null)}
          onEdit={() => openEdit(detailMethod)}
          onDelete={() => openDeleteConfirm(detailMethod.id)}
          onUsage={() => navigate(`/logs?roasting=${encodeURIComponent(detailMethod.roaster_name)}`)}
        />
      )}
      {form && (
        <RoastingMethodForm
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
      <RoastingMethodDeleteDialog
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
