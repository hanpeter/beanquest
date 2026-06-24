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
