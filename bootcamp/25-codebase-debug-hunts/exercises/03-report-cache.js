// ─────────────────────────────────────────────────────────────────────────
//  03 · the cache that forgets in a heartbeat                ★★★ stretch
//  concepts: bug hunt · units crossing file boundaries · TTL
//  run: node 03-report-cache.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The reporting slice, three files, in ./03-report-cache-app/:
//
//      clock.js    injectable time — now() in ms, like Date.now()
//      cache.js    a TTL cache over that clock
//      report.js   the expensive report, "cached for five minutes"
//
//  The spec: computing a report is expensive, so within five minutes of
//  a compute every further call for that name is served from cache; the
//  first call after five minutes recomputes.
//
//  In production the compute counter says the cache barely exists: the
//  same report is recomputed several times A MINUTE while the dashboard
//  polls. No errors, values are correct — the bill is just huge.
//
//  Each file reads fine on its own. 2 tests fail. The bug is a value
//  that changes meaning as it crosses from one file to another — find
//  the crossing, fix it with the smallest change in the file that got
//  the meaning wrong. Don't rewrite.
//
//  hint: pick ONE number in this app and follow it across the import
//  boundary. What unit does the sender mean? What unit does the
//  receiver's doc comment say it expects? Read both comments — out
//  loud, units included.

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
