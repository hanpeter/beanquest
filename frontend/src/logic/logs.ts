import type { PastLog, BeanGroup, Filters, SortKey, KnownBean } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Format an ISO date string (with or without time component) as "Mon D" */
export function fmtDate(iso: string): string {
  const datePart = iso.split('T')[0];
  const [, m, d] = datePart.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** Format an ISO date string (with or without time component) as "Month D, YYYY" */
export function fmtLong(iso: string): string {
  const datePart = iso.split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  return `${MONTHS_FULL[m - 1]} ${d}, ${y}`;
}

/** Number of active filter categories (drives the toolbar badge) */
export function activeCount(f: Filters): number {
  return (
    (f.ratingMin != null ? 1 : 0) +
    (f.procSel.length ? 1 : 0) +
    (f.roastSel.length ? 1 : 0) +
    (f.brewSel.length ? 1 : 0)
  );
}

/** Text fragments for the applied-filters summary row */
export function summaryParts(f: Filters): string[] {
  const parts: string[] = [];
  if (f.ratingMin != null) parts.push(f.ratingMin === 5 ? 'Rating 5' : `Rating ${f.ratingMin}+`);
  if (f.procSel.length) parts.push(f.procSel.join(', '));
  if (f.roastSel.length) parts.push('Roasting: ' + f.roastSel.join(', '));
  if (f.brewSel.length) parts.push('Brewing: ' + f.brewSel.join(', '));
  return parts;
}

/**
 * Filter logs with AND logic across categories, OR within each multi-select.
 * Rating is a minimum threshold; search is a case-insensitive bean-name substring.
 */
export function filterLogs(logs: PastLog[], f: Filters): PastLog[] {
  const q = f.query.trim().toLowerCase();
  return logs.filter(
    l =>
      (f.ratingMin == null || l.rating_score >= f.ratingMin) &&
      (!f.procSel.length || f.procSel.includes(l.process)) &&
      (!f.roastSel.length || f.roastSel.includes(l.roasting_method_name)) &&
      (!f.brewSel.length || f.brewSel.includes(l.brewing_method_name)) &&
      (!q || l.bean_name.toLowerCase().includes(q)),
  );
}

/** Sort a copy of the logs array by the given sort key */
export function sortLogs(logs: PastLog[], sort: SortKey): PastLog[] {
  const cmp: Record<SortKey, (a: PastLog, b: PastLog) => number> = {
    'date-desc': (a, b) => b.date_logged.localeCompare(a.date_logged),
    'date-asc': (a, b) => a.date_logged.localeCompare(b.date_logged),
    'rating-desc': (a, b) => b.rating_score - a.rating_score || b.date_logged.localeCompare(a.date_logged),
    'rating-asc': (a, b) => a.rating_score - b.rating_score || b.date_logged.localeCompare(a.date_logged),
  };
  return [...logs].sort(cmp[sort]);
}

/**
 * Group sorted logs by bean, preserving the first-appearance order of beans.
 * The bean's process tag is taken from the first log in its group.
 */
export function groupByBean(logs: PastLog[]): BeanGroup[] {
  const map = new Map<string, BeanGroup>();
  for (const l of logs) {
    if (!map.has(l.bean_name)) {
      map.set(l.bean_name, { bean: l.bean_name, process: l.process, logs: [] });
    }
    map.get(l.bean_name)!.logs.push(l);
  }
  return [...map.values()];
}

/** Sorted unique process values from the log set (used to populate the Process filter options) */
export function distinctProcesses(logs: PastLog[]): string[] {
  return [...new Set(logs.map(l => l.process))].sort();
}

/**
 * First-appearance-unique bean → process pairs, used for the New Log form's
 * bean typeahead (picking a suggestion auto-fills its process).
 */
export function distinctBeans(logs: PastLog[]): KnownBean[] {
  const map = new Map<string, KnownBean>();
  for (const l of logs) {
    if (!map.has(l.bean_name)) {
      map.set(l.bean_name, { bean: l.bean_name, process: l.process });
    }
  }
  return [...map.values()];
}

/** Other logs of the same bean, excluding the given log itself — for "Other brews of this bean" */
export function siblingLogs(logs: PastLog[], log: PastLog): PastLog[] {
  return logs.filter(l => l.bean_name === log.bean_name && l.id !== log.id);
}
