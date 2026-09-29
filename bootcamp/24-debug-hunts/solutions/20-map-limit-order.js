// ─────────────────────────────────────────────────────────────────────────
//  20 · fast workers, scrambled results — SOLUTION           ★★★ stretch
//  concepts: bug hunt · concurrency · completion vs input order
//  run: node 20-map-limit-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: completion-order scramble. `results.push(...)` appends in
//  the order workers FINISH, but the contract promises the order items
//  ARRIVED. With one lane the two orders coincide, which is why the bug
//  passed review — concurrency is what pulls them apart, and the more
//  latencies vary, the worse the shuffle.
//  The tell: a concurrent loop writing to a shared array with push. Any
//  time work is claimed by index but stored by "whenever", the mapping
//  between input and output has been thrown away.
//  The minimal fix: remember WHICH slot each lane claimed, and store the
//  result into that slot —
//      const slot = next++;
//      results[slot] = await worker(items[slot]);
//  In the wild: paginated fetches assembled with push, worker pools
//  writing CSV rows as they complete, any "the ids and the names are off
//  by a few rows" report. Same family as file 14's stale-response race:
//  concurrency + "last write wins" + no sequencing.

import { test, eq, ok } from '../../_lib/check.js';
import { sleep } from '../../_lib/check.js';

export async function mapLimit(items, limit, worker) {
  const results = [];
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const slot = next++;
      results[slot] = await worker(items[slot]);
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
