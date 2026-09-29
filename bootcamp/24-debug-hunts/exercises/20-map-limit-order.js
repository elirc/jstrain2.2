// ─────────────────────────────────────────────────────────────────────────
//  20 · fast workers, scrambled results                      ★★★ stretch
//  concepts: bug hunt · concurrency · completion vs input order
//  run: node 20-map-limit-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  mapLimit(items, limit, worker) runs the async worker over every item,
//  at most `limit` at a time, and resolves with the results IN INPUT
//  ORDER — like items.map, just throttled:
//
//      mapLimit([a, b, c, d], 2, enrich)  → [ra, rb, rc, rd]
//
//  It shipped, it was fast, and then the enriched export started pairing
//  row 1's data with row 3's id. The scrambling is worse the more the
//  per-item time varies — quiet days are fine, busy days are chaos.
//
//  The code below is fully written — and wrong. 2 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: give each item a distinct latency, then log `(item, position)`
//  at the moment each result is stored. Storing a result and storing it
//  IN THE RIGHT PLACE are two different operations.

import { test, eq, ok } from '../../_lib/check.js';
import { sleep } from '../../_lib/check.js';

export async function mapLimit(items, limit, worker) {
  const results = [];
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const item = items[next++];
      results.push(await worker(item));
    }
  }
  const lanes = Array.from({ length: Math.min(limit, items.length) }, lane);
  await Promise.all(lanes);
  return results;
}

// ──────────────────────────── tests ──────────────────────────────────────

// a worker whose speed varies wildly per item — like real I/O does
const enrich = async (job) => {
  await sleep(job.ms);
  return `${job.id}-enriched`;
};

test('every item gets processed exactly once', async () => {
  const jobs = [
    { id: 'a', ms: 25 }, { id: 'b', ms: 5 },
    { id: 'c', ms: 5 },  { id: 'd', ms: 5 },
  ];
  const out = await mapLimit(jobs, 2, enrich);
  eq(out.length, 4);
  eq([...out].sort(), ['a-enriched', 'b-enriched', 'c-enriched', 'd-enriched']);
});

test('results come back in INPUT order, whatever finishes first', async () => {
  const jobs = [
    { id: 'a', ms: 25 }, { id: 'b', ms: 5 },
    { id: 'c', ms: 5 },  { id: 'd', ms: 5 },
  ];
  const out = await mapLimit(jobs, 2, enrich);
  eq(out, ['a-enriched', 'b-enriched', 'c-enriched', 'd-enriched']);
});

test('never runs more than `limit` workers at once', async () => {
  let active = 0;
  let peak = 0;
  const worker = async (job) => {
    active += 1;
    peak = Math.max(peak, active);
    await sleep(job.ms);
    active -= 1;
    return job.id;
  };
  await mapLimit(
    [{ id: 1, ms: 8 }, { id: 2, ms: 8 }, { id: 3, ms: 8 }, { id: 4, ms: 8 }],
    2,
    worker
  );
  eq(peak, 2);
});

test('the slot for the first item holds the first result', async () => {
  const jobs = [{ id: 'slow', ms: 30 }, { id: 'quick', ms: 2 }];
  const out = await mapLimit(jobs, 2, enrich);
  eq(out[0], 'slow-enriched');
  ok(out[1] === 'quick-enriched', 'and the second slot the second');
});
