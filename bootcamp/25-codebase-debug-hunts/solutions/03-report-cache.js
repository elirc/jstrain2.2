// ─────────────────────────────────────────────────────────────────────────
//  03 · the cache that forgets in a heartbeat — SOLUTION     ★★★ stretch
//  concepts: bug hunt · units crossing file boundaries · TTL
//  run: node 03-report-cache.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: a unit mismatch at a file boundary. report.js wrote
//  `const CACHE_FOR = 300; // five minutes` — five minutes is 300
//  SECONDS, but cache.js's doc says ttlMs is MILLISECONDS, the same
//  unit as clock.now(). So every entry expired 300ms after it was
//  written: correct values, no errors, and a cache that only helps
//  callers who arrive within a third of a second. That's why the
//  symptom was a bill, not a bug report.
//  The tell: a bare number crossing an import boundary with a comment
//  that names a DIFFERENT unit than the receiver documents. In a
//  multi-file hunt, numbers don't carry their units with them — the
//  sender's comment and the receiver's parameter name are the only
//  witnesses, and here they disagreed (`300 // five minutes` vs ttlMs).
//  The minimal fix, in report.js — the file that got the unit wrong:
//      const CACHE_FOR_MS = 5 * 60 * 1000;
//  Writing the arithmetic out and putting the unit IN THE NAME is the
//  habit; `300` with a comment is how it happened.
//  In the wild: seconds-vs-ms is the classic (setTimeout, JWT `exp`,
//  Cache-Control), joined by cents-vs-dollars, bytes-vs-kilobytes, and
//  UTC-vs-local. The Mars Climate Orbiter was lost to this bug class.

import { test, eq, spy } from '../../_lib/check.js';
import { makeClock } from './03-report-cache-app/clock.js';
import { makeReportService } from './03-report-cache-app/report.js';

// ──────────────────────────── tests ──────────────────────────────────────

const MINUTE = 60 * 1000;

function freshService() {
  const clock = makeClock(0);
  const compute = spy((name) => ({ name, rows: 42 }));
  const reports = makeReportService(clock, compute);
  return { clock, compute, reports };
}

test('the first call computes the report', () => {
  const { compute, reports } = freshService();
  eq(reports.get('sales'), { name: 'sales', rows: 42 });
  eq(compute.callCount, 1);
});

test('a call one minute later is served from cache', () => {
  const { clock, compute, reports } = freshService();
  reports.get('sales');
  clock.advance(1 * MINUTE);
  reports.get('sales');
  eq(compute.callCount, 1);
});

test('a polling burst a few seconds apart computes once', () => {
  const { clock, compute, reports } = freshService();
  reports.get('sales');
  clock.advance(2000);
  reports.get('sales');
  clock.advance(2000);
  reports.get('sales');
  eq(compute.callCount, 1);
});

test('the first call after five minutes recomputes', () => {
  const { clock, compute, reports } = freshService();
  reports.get('sales');
  clock.advance(6 * MINUTE);
  reports.get('sales');
  eq(compute.callCount, 2);
});

test('different reports are cached independently', () => {
  const { compute, reports } = freshService();
  reports.get('sales');
  reports.get('signups');
  reports.get('sales');
  reports.get('signups');
  eq(compute.callCount, 2);
});
