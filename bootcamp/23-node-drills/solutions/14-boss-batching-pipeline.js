// ─────────────────────────────────────────────────────────────────────────
//  14 · boss mix · a batching stage — SOLUTION               ★★★ stretch
//  run: node 14-boss-batching-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape is a loop that waits on TWO things — the next
//  record and the deadline — and the whole difficulty lives in the losing
//  half of that race.
//  `Promise.race` does not cancel anything. When the deadline wins, the
//  `iterator.next()` you kicked off is still outstanding, and the record
//  it is waiting for is already spoken for. Call next() again and you
//  have two live pulls on one iterator: the second one steals a record
//  the first will also deliver, and records get dropped or duplicated at
//  exactly the moments a batch times out — the rarest, least reproducible
//  bug in the pipeline. So `pending` holds the outstanding pull across
//  iterations and is cleared only when a record actually arrives. This is
//  the single most transferable idea in the file; it applies to any
//  read-with-timeout you ever write.
//  The deadline is armed on the FIRST record of a batch and cleared the
//  moment the batch leaves — by size, or at the end of the source. Arm it
//  per record instead and a steady trickle never times out at all,
//  because the clock restarts before it can expire. Forget to clear it
//  and you get a phantom timer that fires into an empty buffer, which is
//  why one test asserts `pending() === 0` after a full batch.
//  The end of the source is not a deadline case: yield the remainder at
//  once. Making the last four records of a file wait out a 50 ms window
//  nobody is left to observe is how a "fast" importer ends up slower than
//  the file it read.
//  And because every wait goes through the injected scheduler, the whole
//  policy — deadlines, ten-minute windows, boundary cases at 49 and 50 ms
//  — is asserted exactly, in zero real milliseconds. That is the pattern
//  from exercises 10 and 11, composed with the streaming from 04 to 06.
//  This is the file to come back to on the flight home.

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

const DEADLINE = Symbol('deadline');

export async function* batch(source, options) {
  const { size, ms, scheduler } = options;
  const iterator = source[Symbol.asyncIterator]();

  let buffer = [];
  let pending = null; // an iterator.next() that has not been answered yet
  let timerId = null;
  let deadline = null;

  const arm = () => {
    deadline = new Promise((resolve) => {
      timerId = scheduler.setTimeout(() => resolve(DEADLINE), ms);
    });
  };
  const disarm = () => {
    if (timerId !== null) scheduler.clearTimeout(timerId);
    timerId = null;
    deadline = null;
  };

  for (;;) {
    if (!pending) pending = iterator.next();
    const arrival = pending.then((result) => ({ result }));

    // With an empty buffer there is no deadline to race — nothing is
    // waiting yet, so waiting forever is the correct thing to do.
    const won = buffer.length === 0 ? await arrival : await Promise.race([arrival, deadline]);

    if (won === DEADLINE) {
      disarm();
      yield buffer; // `pending` stays outstanding on purpose
      buffer = [];
      continue;
    }

    pending = null;
    const { value, done } = won.result;
    if (done) break;

    buffer.push(value);
    if (buffer.length === 1) arm(); // the clock starts at the first record
    if (buffer.length >= size) {
      disarm();
      yield buffer;
      buffer = [];
    }
  }

  disarm();
  if (buffer.length > 0) yield buffer; // the tail leaves immediately
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
