// ─────────────────────────────────────────────────────────────────────────
//  30 · Poller                                              ★★★ stretch
//  concepts: Symbol.asyncIterator on a class · AbortSignal · intervals
//  run: node 30-poller-class.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Anything that polls — a job queue, a status endpoint, a device —
//  ends up as a setInterval plus a callback plus a flag to turn it off.
//  Give the class one method instead and the caller writes a loop:
//
//      const poller = new Poller(fetchStatus, {
//        intervalMs: 5,
//        signal: controller.signal,
//      });
//      for await (const status of poller) { ... }   // break to stop
//      controller.abort();                          // or stop from outside
//
//  Rules: wait intervalMs BEFORE each poll (so nothing is yielded
//  instantly), yield whatever the poll function returns — it may be
//  async — and end the loop as soon as the signal is aborted, including
//  when it was already aborted before the first pull. With no signal it
//  runs until the consumer breaks.
//
//  hint: a class method may be an async generator —
//        `async *[Symbol.asyncIterator]() { ... }` — and that one method
//        is the entire protocol

import { test, eq, ok, throws, spy, sleep } from '../../_lib/check.js';

export class Poller {
  constructor(poll, options = {}) {
    throw new Error('TODO');
  }

  async *[Symbol.asyncIterator]() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a Poller is consumable with for await', async () => {
  const poll = spy(() => 'ok');
  const started = Date.now();
  const seen = [];
  for await (const status of new Poller(poll, { intervalMs: 5 })) {
    seen.push(status);
    if (seen.length === 3) break;
  }
  eq(seen, ['ok', 'ok', 'ok']);
  eq(poll.callCount, 3, 'one poll per value, no speculative extras');
  ok(Date.now() - started >= 5, 'it must wait between polls, not spin');
});

test('it awaits whatever the poll function returns', async () => {
  let n = 0;
  const poller = new Poller(
    async () => {
      n += 1;
      return { tick: n };
    },
    { intervalMs: 5 }
  );
  const seen = [];
  for await (const value of poller) {
    seen.push(value);
    if (seen.length === 2) break;
  }
  eq(seen, [{ tick: 1 }, { tick: 2 }]);
});

test('plain for...of throws — the values live behind asyncIterator', () => {
  const poller = new Poller(() => 'ok', { intervalMs: 5 });
  throws(() => {
    for (const value of poller) break;
  }, 'not iterable');
});

test('aborting the signal ends the loop', async () => {
  const controller = new AbortController();
  const poll = spy(() => 'tick');
  const poller = new Poller(poll, {
    intervalMs: 5,
    signal: controller.signal,
  });
  const seen = [];
  for await (const value of poller) {
    seen.push(value);
    if (seen.length === 2) controller.abort();
  }
  eq(seen, ['tick', 'tick'], 'the loop must end on its own after the abort');
  eq(poll.callCount, 2);
});

test('a signal that is already aborted yields nothing', async () => {
  const controller = new AbortController();
  controller.abort();
  const poll = spy(() => 'tick');
  const seen = [];
  for await (const value of new Poller(poll, {
    intervalMs: 5,
    signal: controller.signal,
  })) {
    seen.push(value);
  }
  eq(seen, []);
  eq(poll.callCount, 0, 'an aborted poller must not poll even once');
});

test('breaking out stops the polling for good', async () => {
  const poll = spy(() => 'x');
  for await (const value of new Poller(poll, { intervalMs: 5 })) break;
  const afterBreak = poll.callCount;
  await sleep(15);
  eq(poll.callCount, afterBreak, 'nothing may keep polling after a break');
});
