// ─────────────────────────────────────────────────────────────────────────
//  14 · boss mix · a batching stage                         ★★★ stretch
//  concepts: async generators · racing a timer · injected scheduler
//  run: node 14-boss-batching-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The last drill, and it composes the whole module: a stream stage
//  written as an async generator, a deadline that is not a real timer,
//  and ordering that has to survive both.
//
//  This is the stage every ingest pipeline grows eventually — one write
//  per record is too many round trips, one write per file is too much
//  memory, so you batch by size OR by age, whichever comes first.
//
//  Build `batch(source, { size, ms, scheduler })` — an async generator:
//
//      · yield an array as soon as `size` items have arrived
//      · or `ms` after the FIRST item of that batch arrived, yield
//        whatever the batch holds by then
//      · never yield an empty array
//      · when the source ends, yield what is left straight away — do
//        not make the last records wait out a deadline
//      · items come out in the order they went in
//      · every wait goes through `scheduler`; a real timer here means a
//        test that has to sleep, and this one never does
//
//      size 3, ms 50:   a b c        → [a, b, c]   at once
//                       a … 50ms     → [a]         on the deadline

import { test, eq, ok } from '../../_lib/check.js';

// Provided: the fake scheduler from exercise 10, with advance().
export function createFakeScheduler() {
  let now = 0;
  let nextId = 1;
  let timers = [];

  return {
    now: () => now,
    pending: () => timers.length,
    setTimeout(fn, ms = 0) {
      const id = nextId++;
      timers.push({ id, due: now + ms, fn });
      return id;
    },
    clearTimeout(id) {
      timers = timers.filter((timer) => timer.id !== id);
    },
    advance(ms) {
      const target = now + ms;
      for (;;) {
        const due = timers
          .filter((timer) => timer.due <= target)
          .sort((a, b) => a.due - b.due || a.id - b.id)[0];
        if (!due) break;
        timers = timers.filter((timer) => timer !== due);
        now = due.due;
        due.fn();
      }
      now = target;
      return now;
    },
  };
}

// Provided: a source you drive by hand — push records in, close it when
// there are no more.
export function channel() {
  const values = [];
  const waiting = [];
  let closed = false;

  return {
    push(value) {
      if (waiting.length > 0) waiting.shift()({ value, done: false });
      else values.push(value);
    },
    close() {
      closed = true;
      while (waiting.length > 0) waiting.shift()({ value: undefined, done: true });
    },
    [Symbol.asyncIterator]() {
      return {
        next() {
          if (values.length > 0) {
            return Promise.resolve({ value: values.shift(), done: false });
          }
          if (closed) return Promise.resolve({ value: undefined, done: true });
          return new Promise((resolve) => waiting.push(resolve));
        },
      };
    },
  };
}

// Provided: drain an async iterable into an array, in the background.
export function collect(iterable, into) {
  return (async () => {
    for await (const item of iterable) into.push(item);
  })();
}

// Provided: let every pending microtask run. No real time passes.
export const flush = () => new Promise((resolve) => setImmediate(resolve));

export async function* batch(source, options) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Pulling one value out of an already-finished source tells us whether
// batch() exists yet — without that, an unimplemented generator would
// report as a pile of failures instead of a pile of todos.
const setup = async (options = {}) => {
  const empty = channel();
  empty.close();
  await batch(empty, { size: 1, ms: 1, scheduler: createFakeScheduler() }).next();

  const scheduler = createFakeScheduler();
  const source = channel();
  const out = [];
  const done = collect(
    batch(source, { size: 3, ms: 50, scheduler, ...options }),
    out
  );
  return { scheduler, source, out, done };
};

test('a full batch comes out the moment it fills up', async () => {
  const { source, out, done } = await setup();
  source.push('a');
  source.push('b');
  await flush();
  eq(out, [], 'two of three is not a batch yet');

  source.push('c');
  await flush();
  eq(out, [['a', 'b', 'c']]);
  source.close();
  await done;
});

test('filling up cancels the deadline instead of leaving it armed', async () => {
  const { scheduler, source, out, done } = await setup();
  source.push('a');
  source.push('b');
  source.push('c');
  await flush();
  eq(scheduler.pending(), 0, 'no timer should still be ticking');

  scheduler.advance(10_000);
  await flush();
  eq(out, [['a', 'b', 'c']], 'and no empty batch turns up later');
  source.close();
  await done;
});

test('a partial batch waits, then leaves on the deadline', async () => {
  const { scheduler, source, out, done } = await setup();
  source.push('a');
  await flush();
  scheduler.advance(49);
  await flush();
  eq(out, [], 'still inside the window');

  scheduler.advance(1);
  await flush();
  eq(out, [['a']]);
  source.close();
  await done;
});

test('the deadline runs from the first record, not the last', async () => {
  const { scheduler, source, out, done } = await setup();
  source.push('a');
  await flush();
  scheduler.advance(30);
  await flush();

  source.push('b');
  await flush();
  scheduler.advance(19);
  await flush();
  eq(out, [], 'b must not restart the clock');

  scheduler.advance(1);
  await flush();
  eq(out, [['a', 'b']], '50ms after a, whatever has arrived');
  source.close();
  await done;
});

test('the end of the source flushes the remainder at once', async () => {
  const { scheduler, source, out, done } = await setup();
  source.push('a');
  source.push('b');
  await flush();

  source.close();
  await done;
  eq(out, [['a', 'b']], 'no waiting out a deadline nobody is left for');
  eq(scheduler.pending(), 0, 'and it stops its timer on the way out');
});

test('order survives a long run, and no batch is ever empty', async () => {
  const { source, out, done } = await setup();
  for (const n of [1, 2, 3, 4, 5, 6, 7]) source.push(n);
  await flush();
  eq(out, [
    [1, 2, 3],
    [4, 5, 6],
  ]);

  source.close();
  await done;
  eq(out, [[1, 2, 3], [4, 5, 6], [7]]);
  ok(
    out.every((group) => group.length > 0),
    'an empty batch is a write with nothing in it'
  );
});

test('a source that ends with nothing in it yields nothing', async () => {
  const { scheduler, source, out, done } = await setup();
  source.close();
  await done;
  eq(out, []);
  eq(scheduler.pending(), 0);
});

test('a size of one is a passthrough, and costs no real time', async () => {
  const started = Date.now();
  const { scheduler, source, out, done } = await setup({ size: 1, ms: 60_000 });
  source.push('a');
  source.push('b');
  await flush();
  eq(out, [['a'], ['b']]);

  scheduler.advance(10 * 60_000);
  await flush();
  source.close();
  await done;
  eq(out, [['a'], ['b']]);
  ok(Date.now() - started < 100, 'ten minutes of deadlines, instantly');
});
