// ─────────────────────────────────────────────────────────────────────────
//  28 · merge                                               ★★★ stretch
//  concepts: async generators · racing several sources at once
//  run: node 28-merge-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two websockets, two log tails, two queues: you want ONE stream that
//  hands you each value the moment it lands, whichever source produced
//  it. The obvious loop — `for await` over the first source, then the
//  second — is wrong twice over: the second source is not read at all
//  until the first ends, and the values come out grouped by source
//  instead of by time.
//
//      a: ---a1----------a2--->
//      b: --------b1--b2------>
//      merge(a, b)  → 'a1', 'b1', 'b2', 'a2'      arrival order
//
//  merge(...sources) is an async generator. It ends when every source
//  has ended, one silent source must never hold up the others, and
//  merge() with no sources ends immediately.
//
//  hint: Promise.race hands back the winning VALUE and never says which
//        promise won — so keep one pending next() per source and tag
//        each one with its source before you race them

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
  throw new Error('TODO');
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
