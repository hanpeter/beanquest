import type { SortKey } from './types';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date-desc', label: 'Date — newest first' },
  { key: 'date-asc', label: 'Date — oldest first' },
  { key: 'rating-desc', label: 'Rating — high to low' },
  { key: 'rating-asc', label: 'Rating — low to high' },
];

export const SORT_LABEL: Record<SortKey, string> = {
  'date-desc': 'Date',
  'date-asc': 'Date',
  'rating-desc': 'Rating',
  'rating-asc': 'Rating',
};

// Content column width as a percentage of the viewport, by MUI breakpoint.
// xs/sm are full width; md/lg cap at 85% so the column keeps growing with the
// screen instead of hitting a fixed px ceiling. Shared by the Logs list,
// detail, and form views so their columns stay visually aligned.
export const CONTENT_WIDTH_PCT = { xs: 100, sm: 100, md: 85, lg: 85 } as const;

export const CONTENT_MAX_WIDTH = Object.fromEntries(
  Object.entries(CONTENT_WIDTH_PCT).map(([bp, pct]) => [bp, `${pct}%`]),
) as Record<keyof typeof CONTENT_WIDTH_PCT, string>;
