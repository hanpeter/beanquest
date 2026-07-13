import type { PastLog, RoastingMethod, RoastingSortKey } from '../types';

/** Count of logs per roasting method id, computed once from the shared past-logs data. */
export function usageCounts(logs: PastLog[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const l of logs) {
    counts.set(l.roasting_method_id, (counts.get(l.roasting_method_id) ?? 0) + 1);
  }
  return counts;
}

/** Most recent date_logged among logs using this roasting method, or null if never used. */
export function lastUsed(logs: PastLog[], methodId: number): string | null {
  return logs
    .filter(l => l.roasting_method_id === methodId)
    .map(l => l.date_logged)
    .sort()
    .pop() ?? null;
}

/** Case-insensitive substring match on roaster_name */
export function filterMethods(methods: RoastingMethod[], query: string): RoastingMethod[] {
  const q = query.trim().toLowerCase();
  return q ? methods.filter(m => m.roaster_name.toLowerCase().includes(q)) : methods;
}

/** Sort a copy of the methods array by the given sort key */
export function sortMethods(
  methods: RoastingMethod[],
  sort: RoastingSortKey,
  counts: Map<number, number>,
): RoastingMethod[] {
  const countFor = (m: RoastingMethod) => counts.get(m.id) ?? 0;
  const cmp: Record<RoastingSortKey, (a: RoastingMethod, b: RoastingMethod) => number> = {
    'name-asc': (a, b) => a.roaster_name.localeCompare(b.roaster_name),
    'name-desc': (a, b) => b.roaster_name.localeCompare(a.roaster_name),
    'used-desc': (a, b) => countFor(b) - countFor(a) || a.roaster_name.localeCompare(b.roaster_name),
    'recent': (a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  };
  return [...methods].sort(cmp[sort]);
}

/** Whether another method (excluding editId) already has this name, trimmed & case-insensitive */
export function isDuplicateName(methods: RoastingMethod[], name: string, editId: number | null): boolean {
  const trimmed = name.trim().toLowerCase();
  return methods.some(m => m.id !== editId && m.roaster_name.toLowerCase() === trimmed);
}
