import { usageCounts, lastUsed, filterMethods, sortMethods, isDuplicateName } from './roastingMethods';
import type { PastLog, RoastingMethod } from '../types';

function log(overrides: Partial<PastLog>): PastLog {
  return {
    id: 1, bean_name: 'Guatemala', process: 'Washed',
    target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
    roasting_notes: '', grinder_setting: '', rating_score: 4,
    general_notes: '', date_logged: '2026-06-01T00:00:00',
    brewing_method_name: 'Pour over', roasting_method_name: 'Popcorn popper',
    ...overrides,
  };
}

const METHODS: RoastingMethod[] = [
  { id: 1, roaster_name: 'Popcorn popper', description: 'West Bend Poppery II.', created_at: '2026-01-14', modified_at: '2026-05-30' },
  { id: 2, roaster_name: 'Air roaster', description: '', created_at: '2026-02-20', modified_at: '2026-02-20' },
  { id: 3, roaster_name: 'Cast-iron skillet', description: 'Stovetop, medium flame.', created_at: '2026-03-11', modified_at: '2026-03-11' },
];

const LOGS: PastLog[] = [
  log({ id: 1, roasting_method_id: 1, date_logged: '2026-06-01T00:00:00' }),
  log({ id: 2, roasting_method_id: 1, date_logged: '2026-05-20T00:00:00' }),
  log({ id: 3, roasting_method_id: 3, date_logged: '2026-04-10T00:00:00' }),
];

describe('usageCounts', () => {
  it('counts logs per roasting method id', () => {
    const counts = usageCounts(LOGS);
    expect(counts.get(1)).toBe(2);
    expect(counts.get(3)).toBe(1);
    expect(counts.get(2)).toBeUndefined();
  });

  it('returns an empty map for no logs', () => {
    expect(usageCounts([]).size).toBe(0);
  });
});

describe('lastUsed', () => {
  it('returns the most recent date_logged for a used method', () => {
    expect(lastUsed(LOGS, 1)).toBe('2026-06-01T00:00:00');
  });

  it('returns null for an unused method', () => {
    expect(lastUsed(LOGS, 2)).toBeNull();
  });
});

describe('filterMethods', () => {
  it('returns all methods for an empty query', () => {
    expect(filterMethods(METHODS, '')).toHaveLength(3);
  });

  it('matches case-insensitively as a substring', () => {
    expect(filterMethods(METHODS, 'ROAST')).toEqual([METHODS[1]]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterMethods(METHODS, 'drum')).toEqual([]);
  });
});

describe('sortMethods', () => {
  const counts = usageCounts(LOGS);

  it('sorts name-asc', () => {
    expect(sortMethods(METHODS, 'name-asc', counts).map(m => m.roaster_name)).toEqual([
      'Air roaster', 'Cast-iron skillet', 'Popcorn popper',
    ]);
  });

  it('sorts name-desc', () => {
    expect(sortMethods(METHODS, 'name-desc', counts).map(m => m.roaster_name)).toEqual([
      'Popcorn popper', 'Cast-iron skillet', 'Air roaster',
    ]);
  });

  it('sorts used-desc by count then name tiebreak', () => {
    expect(sortMethods(METHODS, 'used-desc', counts).map(m => m.roaster_name)).toEqual([
      'Popcorn popper', 'Cast-iron skillet', 'Air roaster',
    ]);
  });

  it('sorts recent by created_at desc', () => {
    expect(sortMethods(METHODS, 'recent', counts).map(m => m.roaster_name)).toEqual([
      'Cast-iron skillet', 'Air roaster', 'Popcorn popper',
    ]);
  });

  it('breaks a used-desc tie on name when counts are equal', () => {
    const tied: RoastingMethod[] = [
      { id: 10, roaster_name: 'Zebra roaster', description: '', created_at: '2026-01-01', modified_at: '2026-01-01' },
      { id: 11, roaster_name: 'Alpha roaster', description: '', created_at: '2026-01-01', modified_at: '2026-01-01' },
    ];
    expect(sortMethods(tied, 'used-desc', new Map()).map(m => m.roaster_name)).toEqual([
      'Alpha roaster', 'Zebra roaster',
    ]);
  });

  it('treats a null created_at as earliest when sorting recent', () => {
    const withNull: RoastingMethod[] = [
      { id: 20, roaster_name: 'A', description: '', created_at: null, modified_at: null },
      { id: 21, roaster_name: 'B', description: '', created_at: '2026-01-01', modified_at: '2026-01-01' },
    ];
    expect(sortMethods(withNull, 'recent', new Map()).map(m => m.roaster_name)).toEqual(['B', 'A']);
  });

  it('treats two null created_at values as equal when sorting recent', () => {
    const bothNull: RoastingMethod[] = [
      { id: 22, roaster_name: 'C', description: '', created_at: null, modified_at: null },
      { id: 23, roaster_name: 'D', description: '', created_at: null, modified_at: null },
    ];
    expect(sortMethods(bothNull, 'recent', new Map()).map(m => m.roaster_name)).toEqual(['C', 'D']);
  });

  it('does not mutate the input array', () => {
    const copy = [...METHODS];
    sortMethods(METHODS, 'name-desc', counts);
    expect(METHODS).toEqual(copy);
  });
});

describe('isDuplicateName', () => {
  it('detects a case-insensitive, trimmed duplicate', () => {
    expect(isDuplicateName(METHODS, '  popcorn POPPER  ', null)).toBe(true);
  });

  it('excludes the method being edited', () => {
    expect(isDuplicateName(METHODS, 'Popcorn popper', 1)).toBe(false);
  });

  it('returns false for a new unique name', () => {
    expect(isDuplicateName(METHODS, 'Whirley-Pop', null)).toBe(false);
  });
});
