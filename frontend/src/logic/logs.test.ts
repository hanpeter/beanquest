import {
  fmtDate,
  fmtLong,
  activeCount,
  summaryParts,
  filterLogs,
  sortLogs,
  groupByBean,
  distinctProcesses,
  distinctBeans,
  siblingLogs,
} from './logs';
import type { PastLog, Filters } from '../types';

// ---------------------------------------------------------------------------
// Fixture — mirrors the prototype's sample data mapped to real API field names
// ---------------------------------------------------------------------------
const LOGS: PastLog[] = [
  {
    id: 1, bean_name: 'Guatemala Huehuetenango', process: 'Washed',
    target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
    roasting_notes: 'first crack at 5:30, eased the heat',
    grinder_setting: '20 clicks', rating_score: 4,
    general_notes: 'Rich dark chocolate + toasted walnut.',
    date_logged: '2026-06-01T00:00:00', brewing_method_name: 'Manual espresso',
    roasting_method_name: 'Popcorn popper',
  },
  {
    id: 2, bean_name: 'Guatemala Huehuetenango', process: 'Washed',
    target_roast_level: '', roasting_method_id: 1, brewing_method_id: 2,
    roasting_notes: '9 min, even roast',
    grinder_setting: '18 clicks', rating_score: 4,
    general_notes: 'Bright, tea-like.',
    date_logged: '2026-05-23T00:00:00', brewing_method_name: 'Pour over',
    roasting_method_name: 'Popcorn popper',
  },
  {
    id: 3, bean_name: 'Kenya Nyeri AA', process: 'Washed',
    target_roast_level: '', roasting_method_id: 1, brewing_method_id: 2,
    roasting_notes: '7 min, stirred',
    grinder_setting: '15 clicks', rating_score: 3,
    general_notes: 'Blackcurrant acidity.',
    date_logged: '2026-05-20T00:00:00', brewing_method_name: 'Pour over',
    roasting_method_name: 'Popcorn popper',
  },
  {
    id: 4, bean_name: 'Ethiopia Yirgacheffe', process: 'Natural',
    target_roast_level: '', roasting_method_id: 1, brewing_method_id: 2,
    roasting_notes: '8 min',
    grinder_setting: '16 clicks', rating_score: 4,
    general_notes: 'Floral, jasmine, lemon.',
    date_logged: '2026-05-12T00:00:00', brewing_method_name: 'Pour over',
    roasting_method_name: 'Popcorn popper',
  },
  {
    id: 5, bean_name: 'Ethiopia Yirgacheffe', process: 'Natural',
    target_roast_level: '', roasting_method_id: 2, brewing_method_id: 1,
    roasting_notes: '10 min, fan high',
    grinder_setting: '19 clicks', rating_score: 2,
    general_notes: 'Flat and a bit ashy.',
    date_logged: '2026-05-04T00:00:00', brewing_method_name: 'Manual espresso',
    roasting_method_name: 'Air roaster',
  },
  {
    id: 6, bean_name: 'Colombia La Esperanza', process: 'Anaerobic',
    target_roast_level: '', roasting_method_id: 1, brewing_method_id: 1,
    roasting_notes: '9.5 min',
    grinder_setting: 'Step 11', rating_score: 3,
    general_notes: 'Boozy, red-wine, funky.',
    date_logged: '2026-04-28T00:00:00', brewing_method_name: 'Manual espresso',
    roasting_method_name: 'Popcorn popper',
  },
  {
    id: 7, bean_name: 'Brazil Cerrado', process: 'Natural',
    target_roast_level: '', roasting_method_id: 1, brewing_method_id: 3,
    roasting_notes: '8.5 min',
    grinder_setting: 'Step 9', rating_score: 2,
    general_notes: 'Peanut, milk chocolate.',
    date_logged: '2026-04-19T00:00:00', brewing_method_name: 'Auto espresso',
    roasting_method_name: 'Popcorn popper',
  },
  {
    id: 8, bean_name: 'Sumatra Mandheling', process: 'Washed',
    target_roast_level: '', roasting_method_id: 3, brewing_method_id: 3,
    roasting_notes: '11 min, lots of stirring',
    grinder_setting: 'Step 12', rating_score: 1,
    general_notes: 'Earthy, cedar.',
    date_logged: '2026-04-10T00:00:00', brewing_method_name: 'Auto espresso',
    roasting_method_name: 'Cast-iron skillet',
  },
];

const noFilters: Filters = { ratingMin: null, procSel: [], roastSel: [], brewSel: [], query: '' };

// ---------------------------------------------------------------------------
// fmtDate
// ---------------------------------------------------------------------------
describe('fmtDate', () => {
  it('formats a date-only ISO string', () => {
    expect(fmtDate('2026-06-01')).toBe('Jun 1');
  });

  it('strips the time component', () => {
    expect(fmtDate('2026-05-23T00:00:00')).toBe('May 23');
  });

  it('handles single-digit day', () => {
    expect(fmtDate('2026-04-05')).toBe('Apr 5');
  });

  it('handles all months', () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    months.forEach((m, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(fmtDate(`2026-${mm}-15`)).toBe(`${m} 15`);
    });
  });
});

// ---------------------------------------------------------------------------
// activeCount
// ---------------------------------------------------------------------------
describe('activeCount', () => {
  it('returns 0 when nothing is active', () => {
    expect(activeCount(noFilters)).toBe(0);
  });

  it('counts ratingMin as 1 regardless of value', () => {
    expect(activeCount({ ...noFilters, ratingMin: 0 })).toBe(1);
    expect(activeCount({ ...noFilters, ratingMin: 5 })).toBe(1);
  });

  it('counts each non-empty array as 1', () => {
    expect(activeCount({ ...noFilters, procSel: ['Washed'] })).toBe(1);
    expect(activeCount({ ...noFilters, roastSel: ['Popcorn popper'] })).toBe(1);
    expect(activeCount({ ...noFilters, brewSel: ['Pour over'] })).toBe(1);
  });

  it('accumulates all four active categories', () => {
    expect(activeCount({
      ratingMin: 3, procSel: ['Washed'], roastSel: ['Popcorn popper'], brewSel: ['Pour over'], query: '',
    })).toBe(4);
  });

  it('counts multiple selections in one array as 1, not N', () => {
    expect(activeCount({ ...noFilters, procSel: ['Washed', 'Natural'] })).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// summaryParts
// ---------------------------------------------------------------------------
describe('summaryParts', () => {
  it('returns empty array when nothing is active', () => {
    expect(summaryParts(noFilters)).toEqual([]);
  });

  it('shows "Rating N+" for ratingMin < 5', () => {
    expect(summaryParts({ ...noFilters, ratingMin: 3 })).toEqual(['Rating 3+']);
  });

  it('shows "Rating 5" (not "Rating 5+") for ratingMin === 5', () => {
    expect(summaryParts({ ...noFilters, ratingMin: 5 })).toEqual(['Rating 5']);
  });

  it('shows "Rating 0+" for ratingMin === 0', () => {
    expect(summaryParts({ ...noFilters, ratingMin: 0 })).toEqual(['Rating 0+']);
  });

  it('joins process selections with ", "', () => {
    expect(summaryParts({ ...noFilters, procSel: ['Washed', 'Natural'] })).toEqual(['Washed, Natural']);
  });

  it('prefixes roasting selections', () => {
    expect(summaryParts({ ...noFilters, roastSel: ['Popcorn popper'] })).toEqual(['Roasting: Popcorn popper']);
  });

  it('prefixes brewing selections', () => {
    expect(summaryParts({ ...noFilters, brewSel: ['Pour over'] })).toEqual(['Brewing: Pour over']);
  });

  it('returns all parts in order: rating, process, roasting, brewing', () => {
    const parts = summaryParts({
      ratingMin: 4, procSel: ['Washed'], roastSel: ['Popcorn popper'], brewSel: ['Pour over'], query: '',
    });
    expect(parts).toEqual(['Rating 4+', 'Washed', 'Roasting: Popcorn popper', 'Brewing: Pour over']);
  });
});

// ---------------------------------------------------------------------------
// filterLogs
// ---------------------------------------------------------------------------
describe('filterLogs', () => {
  it('returns all logs when no filters are active', () => {
    expect(filterLogs(LOGS, noFilters)).toHaveLength(LOGS.length);
  });

  it('filters by ratingMin — keeps logs >= threshold', () => {
    const result = filterLogs(LOGS, { ...noFilters, ratingMin: 4 });
    expect(result.every(l => l.rating_score >= 4)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('ratingMin 0 keeps everything', () => {
    expect(filterLogs(LOGS, { ...noFilters, ratingMin: 0 })).toHaveLength(LOGS.length);
  });

  it('ratingMin 5 keeps only perfect scores', () => {
    const result = filterLogs(LOGS, { ...noFilters, ratingMin: 5 });
    expect(result.every(l => l.rating_score === 5)).toBe(true);
  });

  it('filters by process — OR within multi-select', () => {
    const result = filterLogs(LOGS, { ...noFilters, procSel: ['Natural'] });
    expect(result.every(l => l.process === 'Natural')).toBe(true);
    const multi = filterLogs(LOGS, { ...noFilters, procSel: ['Natural', 'Anaerobic'] });
    expect(multi.every(l => ['Natural', 'Anaerobic'].includes(l.process))).toBe(true);
    expect(multi.length).toBeGreaterThan(result.length);
  });

  it('filters by roasting method name', () => {
    const result = filterLogs(LOGS, { ...noFilters, roastSel: ['Air roaster'] });
    expect(result.every(l => l.roasting_method_name === 'Air roaster')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('filters by brewing method name', () => {
    const result = filterLogs(LOGS, { ...noFilters, brewSel: ['Auto espresso'] });
    expect(result.every(l => l.brewing_method_name === 'Auto espresso')).toBe(true);
  });

  it('filters by query — case-insensitive bean name substring', () => {
    const result = filterLogs(LOGS, { ...noFilters, query: 'ethiopia' });
    expect(result.every(l => l.bean_name.toLowerCase().includes('ethiopia'))).toBe(true);
    expect(result.length).toBe(2);
  });

  it('query ignores non-bean fields', () => {
    const result = filterLogs(LOGS, { ...noFilters, query: 'popcorn' });
    expect(result).toHaveLength(0);
  });

  it('combines filters with AND logic across categories', () => {
    const result = filterLogs(LOGS, {
      ratingMin: 4, procSel: ['Washed'], roastSel: [], brewSel: [], query: '',
    });
    expect(result.every(l => l.rating_score >= 4 && l.process === 'Washed')).toBe(true);
  });

  it('returns empty array when no logs match', () => {
    expect(filterLogs(LOGS, { ...noFilters, ratingMin: 5, procSel: ['Anaerobic'] })).toHaveLength(0);
  });

  it('trims whitespace in query', () => {
    const withSpaces = filterLogs(LOGS, { ...noFilters, query: '  kenya  ' });
    const trimmed = filterLogs(LOGS, { ...noFilters, query: 'kenya' });
    expect(withSpaces).toEqual(trimmed);
  });
});

// ---------------------------------------------------------------------------
// sortLogs
// ---------------------------------------------------------------------------
describe('sortLogs', () => {
  it('date-desc: most recent first', () => {
    const sorted = sortLogs(LOGS, 'date-desc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].date_logged >= sorted[i].date_logged).toBe(true);
    }
  });

  it('date-asc: oldest first', () => {
    const sorted = sortLogs(LOGS, 'date-asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].date_logged <= sorted[i].date_logged).toBe(true);
    }
  });

  it('rating-desc: highest rating first', () => {
    const sorted = sortLogs(LOGS, 'rating-desc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].rating_score >= sorted[i].rating_score).toBe(true);
    }
  });

  it('rating-asc: lowest rating first', () => {
    const sorted = sortLogs(LOGS, 'rating-asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].rating_score <= sorted[i].rating_score).toBe(true);
    }
  });

  it('rating-desc tiebreak: equal ratings sorted by date-desc', () => {
    const sorted = sortLogs(LOGS, 'rating-desc');
    // Find consecutive items with equal rating and verify date order
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].rating_score === sorted[i].rating_score) {
        expect(sorted[i - 1].date_logged >= sorted[i].date_logged).toBe(true);
      }
    }
  });

  it('rating-asc tiebreak: equal ratings sorted by date-desc', () => {
    const sorted = sortLogs(LOGS, 'rating-asc');
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].rating_score === sorted[i].rating_score) {
        expect(sorted[i - 1].date_logged >= sorted[i].date_logged).toBe(true);
      }
    }
  });

  it('does not mutate the input array', () => {
    const original = [...LOGS];
    sortLogs(LOGS, 'date-asc');
    expect(LOGS).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// groupByBean
// ---------------------------------------------------------------------------
describe('groupByBean', () => {
  it('groups logs under the correct bean name', () => {
    const groups = groupByBean(LOGS);
    const gt = groups.find(g => g.bean === 'Guatemala Huehuetenango');
    expect(gt).toBeDefined();
    expect(gt!.logs).toHaveLength(2);
    expect(gt!.logs.every(l => l.bean_name === 'Guatemala Huehuetenango')).toBe(true);
  });

  it('produces one group per unique bean', () => {
    const groups = groupByBean(LOGS);
    const beans = groups.map(g => g.bean);
    expect(new Set(beans).size).toBe(beans.length);
  });

  it('preserves the first-appearance order of beans from the input', () => {
    const sorted = sortLogs(LOGS, 'date-desc');
    const groups = groupByBean(sorted);
    // Guatemala (most recent: Jun 1) should come first after date-desc sort
    expect(groups[0].bean).toBe('Guatemala Huehuetenango');
  });

  it('takes process from the first log in the group', () => {
    const groups = groupByBean(LOGS);
    const ethiopia = groups.find(g => g.bean === 'Ethiopia Yirgacheffe')!;
    // First Ethiopia log in LOGS array is id=4 (Natural)
    expect(ethiopia.process).toBe('Natural');
  });

  it('returns empty array for empty input', () => {
    expect(groupByBean([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// distinctProcesses
// ---------------------------------------------------------------------------
describe('distinctProcesses', () => {
  it('returns unique process values sorted alphabetically', () => {
    const result = distinctProcesses(LOGS);
    expect(result).toEqual([...new Set(result)]);
    expect(result).toEqual([...result].sort());
  });

  it('includes all four processes present in the fixture', () => {
    const result = distinctProcesses(LOGS);
    expect(result).toContain('Washed');
    expect(result).toContain('Natural');
    expect(result).toContain('Anaerobic');
  });

  it('returns empty array for empty input', () => {
    expect(distinctProcesses([])).toEqual([]);
  });

  it('deduplicates correctly', () => {
    const logs = [
      { ...LOGS[0], process: 'Washed' },
      { ...LOGS[1], process: 'Washed' },
    ];
    expect(distinctProcesses(logs)).toEqual(['Washed']);
  });
});

// ---------------------------------------------------------------------------
// fmtLong
// ---------------------------------------------------------------------------
describe('fmtLong', () => {
  it('formats a date-only ISO string as "Month D, YYYY"', () => {
    expect(fmtLong('2026-06-01')).toBe('June 1, 2026');
  });

  it('strips the time component', () => {
    expect(fmtLong('2026-05-23T00:00:00')).toBe('May 23, 2026');
  });

  it('handles all months', () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    months.forEach((m, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(fmtLong(`2026-${mm}-15`)).toBe(`${m} 15, 2026`);
    });
  });
});

// ---------------------------------------------------------------------------
// distinctBeans
// ---------------------------------------------------------------------------
describe('distinctBeans', () => {
  it('returns one entry per unique bean', () => {
    const beans = distinctBeans(LOGS);
    const names = beans.map(b => b.bean);
    expect(new Set(names).size).toBe(names.length);
  });

  it('takes process from the first-appearance log for that bean', () => {
    const beans = distinctBeans(LOGS);
    const ethiopia = beans.find(b => b.bean === 'Ethiopia Yirgacheffe')!;
    // First Ethiopia log in LOGS array is id=4 (Natural)
    expect(ethiopia.process).toBe('Natural');
  });

  it('returns empty array for empty input', () => {
    expect(distinctBeans([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// siblingLogs
// ---------------------------------------------------------------------------
describe('siblingLogs', () => {
  it('returns other logs of the same bean, excluding itself', () => {
    const target = LOGS.find(l => l.id === 1)!;
    const siblings = siblingLogs(LOGS, target);
    expect(siblings.every(l => l.bean_name === target.bean_name)).toBe(true);
    expect(siblings.some(l => l.id === target.id)).toBe(false);
    expect(siblings).toHaveLength(1);
  });

  it('returns empty array when the bean has no other logs', () => {
    const target = LOGS.find(l => l.id === 3)!; // Kenya Nyeri AA — single log
    expect(siblingLogs(LOGS, target)).toEqual([]);
  });
});
