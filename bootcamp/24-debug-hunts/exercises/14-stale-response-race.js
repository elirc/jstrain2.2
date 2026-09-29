// ─────────────────────────────────────────────────────────────────────────
//  14 · search as you type                                   ★★★ stretch
//  concepts: bug hunt · races · stale responses
//  run: node 14-stale-response-race.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A search box that fires a request per keystroke. The contract is one
//  line long: whatever is on screen belongs to the NEWEST query typed.
//  Responses come back whenever the network feels like it — out of
//  order, sometimes never — and the box has to survive that.
//
//      box.type('ant')                → results for 'ant'
//      box.value                      → the last thing typed, always
//      box.type('') then box.results  → [] with no request sent
//
//      type('a') takes 30ms, then type('ante') takes 4ms
//        → box.results is the answer for 'ante', not the one for 'a'
//
//  The code below is fully written — and wrong. 2 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: two things happen at once here, so a trace beats a re-read.
//  Print one line when a request is SENT and one when its response
//  LANDS, each with its query. The bug is visible in the order of those
//  four lines, not in any single line of the function.

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

const INDEX = ['ant', 'anteater', 'antelope', 'bear', 'beaver', 'cat'];

export function makeSearchApi(index, latency = {}) {
  return async function search(query) {
    await sleep(latency[query] ?? 4);
    const prefix = query.toLowerCase();
    return index.filter((entry) => entry.startsWith(prefix));
  };
}

export function createSearchBox(search) {
  let query = '';
  let results = [];
  let error = null;
  let pending = 0;

  async function type(next) {
    query = next;
    if (next.trim() === '') {
      results = [];
      return results;
    }
    pending += 1;
    try {
      const hits = await search(next);
      results = hits;
      return hits;
    } catch (err) {
      error = err;
      return [];
    } finally {
      pending -= 1;
    }
  }

  return {
    type,
    get value() {
      return query;
    },
    get results() {
      return results;
    },
    get pending() {
      return pending;
    },
    get error() {
      return error;
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one query in, its results out', async () => {
  const box = createSearchBox(makeSearchApi(INDEX));
  eq(await box.type('ante'), ['anteater', 'antelope']);
  eq(box.results, ['anteater', 'antelope']);
  eq(box.error, null);
});

test('the value is the last thing typed, before any response', async () => {
  const box = createSearchBox(makeSearchApi(INDEX));
  const inFlight = box.type('ant');
  eq(box.value, 'ant');
  eq(box.pending, 1);
  await inFlight;
  eq(box.pending, 0);
});

test('clearing the box clears the results without a request', async () => {
  const search = spy(makeSearchApi(INDEX));
  const box = createSearchBox(search);
  await box.type('ant');
  eq(search.callCount, 1);
  await box.type('   ');
  eq(box.results, []);
  eq(search.callCount, 1);
});

test('a failed search is recorded instead of crashing the box', async () => {
  const search = async () => {
    await sleep(2);
    throw new Error('search backend is down');
  };
  const box = createSearchBox(search);
  eq(await box.type('ant'), []);
  ok(box.error instanceof Error);
  eq(box.error.message, 'search backend is down');
  eq(box.pending, 0);
});

test('responses that arrive in order leave the newest answer', async () => {
  const search = makeSearchApi(INDEX, { a: 4, ante: 20 });
  const box = createSearchBox(search);
  await Promise.all([box.type('a'), box.type('ante')]);
  eq(box.results, ['anteater', 'antelope']);
});

test('a slow first response never overwrites a fast second one', async () => {
  const search = makeSearchApi(INDEX, { a: 30, ante: 4 });
  const box = createSearchBox(search);
  await Promise.all([box.type('a'), box.type('ante')]);
  eq(box.value, 'ante');
  eq(box.results, ['anteater', 'antelope']);
});

test('three keystrokes end on the third, whatever the latencies', async () => {
  const search = makeSearchApi(INDEX, { ant: 6, ante: 30, antel: 10 });
  const box = createSearchBox(search);
  await Promise.all([
    box.type('ant'),
    box.type('ante'),
    box.type('antel'),
  ]);
  eq(box.value, 'antel');
  eq(box.results, ['antelope']);
  eq(box.pending, 0);
});
