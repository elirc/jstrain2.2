// ─────────────────────────────────────────────────────────────────────────
//  28 · merge — SOLUTION                                    ★★★ stretch
//  run: node 28-merge-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: ask every source for its next value AT ONCE, race the
//  promises, and re-arm only the source that won. That is why values
//  come out by arrival time — at any moment there is exactly one
//  outstanding next() per source, so whoever settles first is by
//  definition the next thing that happened anywhere.
//
//  Promise.race resolves with the winning value and tells you nothing
//  about where it came from, so each pending promise is tagged with its
//  index — `.then((result) => ({ index, result }))`. Without that tag
//  you cannot know which iterator to pull again, and that is the bug
//  that makes home-made merges drop or duplicate values.
//
//  Take the iterators with [Symbol.asyncIterator]() by hand instead of
//  looping with `for await`: a for-await loop over source A cannot be
//  paused to serve source B, which is exactly the shape you are trying
//  to escape.
//
//  A source that reports done is deleted from the map, so the loop ends
//  when the last one drops out — and merge() with no sources never
//  enters the loop at all.

import { test, eq, ok, sleep } from '../../_lib/check.js';

// scaffolding: a hand-driven async source (push a value in, a pending
// next() resolves with it), a timed source, and a background collector
// whose run.tick() lets the machinery settle without waiting on a real
// timer. Do not edit.
function channel() {
  const queued = [];
  const waiting = [];
  let closed = false;
  return {
    push(value) {
      if (waiting.length > 0) waiting.shift()({ value, done: false });
      else queued.push({ value, done: false });
    },
    close() {
      closed = true;
      while (waiting.length > 0) {
        waiting.shift()({ value: undefined, done: true });
      }
    },
    stream: {
      [Symbol.asyncIterator]() {
        return {
          next() {
            if (queued.length > 0) return Promise.resolve(queued.shift());
            if (closed) {
              return Promise.resolve({ value: undefined, done: true });
            }
            return new Promise((resolve) => waiting.push(resolve));
          },
        };
      },
    },
  };
}

async function* at(steps) {
  for (const [ms, value] of steps) {
    await sleep(ms);
    yield value;
  }
}

function collectInBackground(asyncIterable) {
  const values = [];
  let failure = null;
  const done = (async () => {
    for await (const value of asyncIterable) values.push(value);
  })();
  done.catch((error) => {
    failure = error;
  });
  return {
    values,
    done,
    // let every pending microtask settle — no real time passes
    async tick() {
      await new Promise((resolve) => setImmediate(resolve));
      if (failure) throw failure;
    },
  };
}

export async function* merge(...sources) {
  const iterators = sources.map((source) => source[Symbol.asyncIterator]());
  const pending = new Map();

  const arm = (index) => {
    pending.set(
      index,
      iterators[index].next().then((result) => ({ index, result }))
    );
  };

  iterators.forEach((_, index) => arm(index));

  while (pending.size > 0) {
    const { index, result } = await Promise.race(pending.values());
    if (result.done) {
      pending.delete(index);
    } else {
      arm(index);
      yield result.value;
    }
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('values come out in arrival order, not source order', async () => {
  const a = channel();
  const b = channel();
  const run = collectInBackground(merge(a.stream, b.stream));
  await run.tick();
  a.push('a1');
  await run.tick();
  b.push('b1');
  await run.tick();
  b.push('b2');
  await run.tick();
  a.push('a2');
  await run.tick();
  a.close();
  b.close();
  await run.done;
  eq(run.values, ['a1', 'b1', 'b2', 'a2']);
});

test('a silent source never holds up the others', async () => {
  const quiet = channel();
  const chatty = channel();
  const run = collectInBackground(merge(quiet.stream, chatty.stream));
  await run.tick();
  chatty.push(1);
  await run.tick();
  chatty.push(2);
  await run.tick();
  eq(run.values, [1, 2], 'reading source one first would block here');
  quiet.close();
  chatty.close();
  await run.done;
});

test('a source that ends early leaves the rest running', async () => {
  const a = channel();
  const b = channel();
  const run = collectInBackground(merge(a.stream, b.stream));
  await run.tick();
  a.push('a1');
  await run.tick();
  a.close();
  await run.tick();
  b.push('b1');
  await run.tick();
  b.close();
  await run.done;
  eq(run.values, ['a1', 'b1']);
});

test('an empty source is simply skipped', async () => {
  const empty = channel();
  empty.close();
  const one = channel();
  const run = collectInBackground(merge(empty.stream, one.stream));
  await run.tick();
  one.push('x');
  await run.tick();
  one.close();
  await run.done;
  eq(run.values, ['x']);
});

test('merging nothing ends immediately', async () => {
  const run = collectInBackground(merge());
  await run.done;
  eq(run.values, []);
});

test('merging one source is that source', async () => {
  const only = channel();
  const run = collectInBackground(merge(only.stream));
  await run.tick();
  only.push('a');
  only.push('b');
  only.close();
  await run.done;
  eq(run.values, ['a', 'b']);
});

test('it works on real timed sources too', async () => {
  const out = [];
  const a = at([[1, 'a1'], [1, 'a2']]);
  const b = at([[1, 'b1']]);
  for await (const value of merge(a, b)) {
    out.push(value);
  }
  eq(out.length, 3);
  eq(out.filter((v) => v.startsWith('a')), ['a1', 'a2']);
  ok(out.includes('b1'), 'the second source must be drained as well');
});
