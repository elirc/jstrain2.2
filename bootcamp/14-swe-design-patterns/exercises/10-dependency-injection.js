// ─────────────────────────────────────────────────────────────────────────
//  10 · ReportService                                           ★★☆ core
//  concepts: dependency injection · seams · testability
//  run: node exercises/10-dependency-injection.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A service that calls `Date.now()`, `Math.random()` and a database
//  directly cannot be tested — you can only hope. Take all three in as
//  collaborators instead.
//
//      createReportService({ clock, random, store })
//        clock()   → epoch milliseconds
//        random()  → a number in [0, 1)
//        store     → { save(report), all() }
//
//      service.generate('u1', [{ amount: 30 }, { amount: 12 }])
//        → { id: 'RPT-1234',                    // Math.floor(random()*10000)
//            userId: 'u1',                      // padded to 4 digits
//            createdAt: '2023-11-14T22:13:20.000Z',   // ISO, from clock()
//            rowCount: 2,
//            total: 42 }
//        …and the very same object is handed to store.save().
//
//      service.history('u1') → every saved report for that user, in order
//
//  Also write `createMemoryStore()` — the real collaborator: `save`
//  appends, `all` returns the records without exposing its own array.
//
//  hint: `new Date(ms).toISOString()` is UTC, so it never depends on the
//  machine's time zone

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createMemoryStore() {
  throw new Error('TODO');
}

export function createReportService({ clock, random, store }) {
  throw new Error('TODO');
}

const AT = 1700000000000; // 2023-11-14T22:13:20.000Z
const fixedClock = (ms) => () => ms;
const seq = (...values) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};
const ROWS = [{ amount: 30 }, { amount: 12 }];

// ──────────────────────────── tests ──────────────────────────────────────

test('the report is stamped with the injected clock', () => {
  const service = createReportService({
    clock: fixedClock(AT),
    random: seq(0.12345),
    store: createMemoryStore(),
  });
  eq(service.generate('u1', ROWS).createdAt, '2023-11-14T22:13:20.000Z');
});

test('the id comes from the injected random, padded to four digits', () => {
  const service = createReportService({
    clock: fixedClock(AT),
    random: seq(0.12345, 0.0007),
    store: createMemoryStore(),
  });
  eq(service.generate('u1', ROWS).id, 'RPT-1234');
  eq(service.generate('u1', ROWS).id, 'RPT-0007');
});

test('the report totals and counts the rows', () => {
  const service = createReportService({
    clock: fixedClock(AT),
    random: seq(0.5),
    store: createMemoryStore(),
  });
  const report = service.generate('u1', ROWS);
  eq(report.rowCount, 2);
  eq(report.total, 42);
  eq(report.userId, 'u1');
  eq(service.generate('u1', []).total, 0);
});

test('the report is handed to the store exactly once', () => {
  const store = { save: spy(), all: () => [] };
  const service = createReportService({
    clock: fixedClock(AT),
    random: seq(0.5),
    store,
  });
  const report = service.generate('u1', ROWS);
  eq(store.save.callCount, 1);
  ok(store.save.calls[0][0] === report, 'save got a different object');
});

test('history filters the store by user', () => {
  const service = createReportService({
    clock: fixedClock(AT),
    random: seq(0.1, 0.2, 0.3),
    store: createMemoryStore(),
  });
  service.generate('u1', ROWS);
  service.generate('u2', ROWS);
  service.generate('u1', ROWS);
  eq(service.history('u1').map((r) => r.id), ['RPT-1000', 'RPT-3000']);
  eq(service.history('nobody'), []);
});

test('a different clock gives a different report, with no globals', () => {
  const store = createMemoryStore();
  const later = createReportService({
    clock: fixedClock(AT + 86400000),
    random: seq(0.5),
    store,
  });
  eq(later.generate('u1', ROWS).createdAt, '2023-11-15T22:13:20.000Z');
});

test('the memory store keeps its array to itself', () => {
  const store = createMemoryStore();
  eq(store.all(), []);
  store.save({ id: 'a' });
  store.all().push({ id: 'sneaky' });
  eq(store.all(), [{ id: 'a' }]);
});
