import type { BrewingMethod, BrewingSortKey, PastLog } from '../types';

/** Count of logs per brewing method id, computed once from the shared past-logs data. */
export function usageCounts(logs: PastLog[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const l of logs) {
    counts.set(l.brewing_method_id, (counts.get(l.brewing_method_id) ?? 0) + 1);
  }
  return counts;
}

/** Most recent date_logged among logs using this brewing method, or null if never used. */
export function lastUsed(logs: PastLog[], methodId: number): string | null {
  return logs
    .filter(l => l.brewing_method_id === methodId)
    .map(l => l.date_logged)
    .sort()
    .pop() ?? null;
}

/** Case-insensitive substring match on method_name */
export function filterMethods(methods: BrewingMethod[], query: string): BrewingMethod[] {
  const q = query.trim().toLowerCase();
  return q ? methods.filter(m => m.method_name.toLowerCase().includes(q)) : methods;
}

/** Sort a copy of the methods array by the given sort key */
export function sortMethods(
  methods: BrewingMethod[],
  sort: BrewingSortKey,
  counts: Map<number, number>,
): BrewingMethod[] {
  const countFor = (m: BrewingMethod) => counts.get(m.id) ?? 0;
  const cmp: Record<BrewingSortKey, (a: BrewingMethod, b: BrewingMethod) => number> = {
    'name-asc': (a, b) => a.method_name.localeCompare(b.method_name),
    'name-desc': (a, b) => b.method_name.localeCompare(a.method_name),
    'used-desc': (a, b) => countFor(b) - countFor(a) || a.method_name.localeCompare(b.method_name),
    'recent': (a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  };
  return [...methods].sort(cmp[sort]);
}

/** Whether another method (excluding editId) already has this name, trimmed & case-insensitive */
export function isDuplicateName(methods: BrewingMethod[], name: string, editId: number | null): boolean {
  const trimmed = name.trim().toLowerCase();
  return methods.some(m => m.id !== editId && m.method_name.toLowerCase() === trimmed);
}
