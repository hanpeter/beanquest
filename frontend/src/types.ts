export interface PastLog {
  id: number;
  bean_name: string;
  process: string;
  target_roast_level: string;
  roasting_method_id: number;
  brewing_method_id: number;
  roasting_notes: string;
  grinder_setting: string;
  rating_score: number;
  general_notes: string;
  date_logged: string;
  brewing_method_name: string;
  roasting_method_name: string;
}

export interface BrewingMethod {
  id: number;
  method_name: string;
  machine_used: string;
  grinder_used: string;
  created_at: string | null;
  modified_at: string | null;
}

export interface RoastingMethod {
  id: number;
  roaster_name: string;
  description: string;
  created_at: string | null;
  modified_at: string | null;
}

export type SortKey = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc';

export interface BeanGroup {
  bean: string;
  process: string;
  logs: PastLog[];
}

export interface Filters {
  ratingMin: number | null;
  procSel: string[];
  roastSel: string[];
  brewSel: string[];
  query: string;
}

export type FilterPanel = 'filter' | 'process' | 'roasting' | 'brewing';

/** Payload for creating/updating a PastLog — mirrors the backend's writable fields. */
export interface PastLogInput {
  bean_name: string;
  process: string;
  roasting_method_id: number;
  brewing_method_id: number;
  roasting_notes: string;
  grinder_setting: string;
  rating_score: number;
  general_notes: string;
  date_logged: string;
}

/** Bean name + its most recently seen process, used for the New Log form's typeahead. */
export interface KnownBean {
  bean: string;
  process: string;
}

/** New/edit/brew-again form state, held by LogsPage. */
export interface LogFormState {
  title: string;
  editId: number | null;
  seed: Partial<PastLogInput>;
}

export type RoastingSortKey = 'name-asc' | 'name-desc' | 'used-desc' | 'recent';

/** Payload for creating/updating a RoastingMethod — mirrors the backend's writable fields. */
export interface RoastingMethodInput {
  roaster_name: string;
  description: string;
}

/** New/edit form state, held by RoastingMethodsPage. */
export interface RoastingMethodFormState {
  title: string;
  editId: number | null;
  seed: Partial<RoastingMethodInput>;
}
