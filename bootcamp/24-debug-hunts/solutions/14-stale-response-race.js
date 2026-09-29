// ─────────────────────────────────────────────────────────────────────────
//  14 · search as you type — SOLUTION                        ★★★ stretch
//  run: node 14-stale-response-race.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: bug class — stale response. `await` suspends the
//  function, and while it is suspended the world moves on. The code
//  after the await was written as if it were still the only thing
//  running; by the time it resumes, two more keystrokes have been typed
//  and it cheerfully publishes an answer to a question nobody asked.
//
//  The tell: an assignment to shared state on the line after an `await`,
//  with nothing in between that re-checks the state. Read every await as
//  "the caller can do anything at all right here" and then ask what the
//  next line still assumes.
//
//  The minimal fix: `if (next === query) results = hits;`. The response
//  proves it is still wanted before it is allowed to write. That is the
//  general pattern — a sequence number, a request id, an AbortController
//  — but here the query string is already the token.
//
//  What the tests do not cover: the `catch` has exactly the same hole,
//  so a stale failure can still blank a good result. Fix it too in real
//  code. And note the passing test right above the failing one — with
//  latencies in the friendly order the bug is invisible, which is how it
//  reaches production in the first place.
//
//  The classic wild variant: `Promise.race` used as a cancel. It cancels
//  nothing; the loser still runs and still writes.

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
      if (next === query) results = hits;
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
