// ─────────────────────────────────────────────────────────────────────────
//  10 · ReportService — SOLUTION                                ★★☆ core
//  concepts: dependency injection · seams · testability
//  run: node solutions/10-dependency-injection.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — hand a unit its collaborators instead of letting it reach out
//  and grab them, so every dependency becomes a seam you can replace.
//  Notice what the tests never do: no fake timers, no monkey-patching of
//  `Date.now`, no test database, no `jest.mock`. A frozen clock and a
//  scripted `random` turn two sources of chaos into ordinary arguments,
//  and asserting "the report reached the store" is a one-line spy.
//  That is the real payoff — DI is a *testability* pattern first and an
//  architecture pattern second.
//  When NOT to use: don't inject things that never vary (`JSON.parse`).
//  Injecting everything produces constructors with fifteen parameters
//  and a "wiring" file nobody can read.
//  In the wild: React context and hooks, Angular's injector, NestJS
//  providers, `express(app)` handed a router — and every `options` bag
//  that takes a `fetch` implementation.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createMemoryStore() {
  const records = [];
  return {
    save(record) {
      records.push(record);
    },
    all() {
      return [...records];
    },
  };
}

export function createReportService({ clock, random, store }) {
  return {
    generate(userId, rows) {
      const serial = String(Math.floor(random() * 10000)).padStart(4, '0');
      const report = {
        id: `RPT-${serial}`,
        userId,
        createdAt: new Date(clock()).toISOString(),
        rowCount: rows.length,
        total: rows.reduce((sum, row) => sum + row.amount, 0),
      };
      store.save(report);
      return report;
    },
    history(userId) {
      return store.all().filter((report) => report.userId === userId);
    },
  };
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
