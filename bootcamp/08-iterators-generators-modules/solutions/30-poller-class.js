// ─────────────────────────────────────────────────────────────────────────
//  30 · Poller — SOLUTION                                   ★★★ stretch
//  run: node 30-poller-class.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one method makes the whole class a first-class stream.
//  `async *[Symbol.asyncIterator]()` is a computed method name plus the
//  async-generator syntax, and because for-await asks an object for
//  exactly that method, the class needs nothing else — no start(), no
//  stop(), no listener bookkeeping.
//
//  The loop waits BEFORE polling, then checks the signal a second time,
//  because a signal can flip during the wait; an abort at millisecond 3
//  of a 5ms interval should not produce one last stale reading. The
//  `while (!aborted)` at the top covers the already-aborted case, so a
//  dead poller never calls poll() at all.
//
//  Ending on break is not something you write: for-await calls
//  .return() on the async generator, which unwinds it exactly like a
//  sync generator. Any cleanup would go in a finally block right here —
//  and the fact that this loop needs none is why the AbortSignal is
//  worth the trouble: the alternative, setInterval, keeps firing until
//  someone remembers the id.

import { test, eq, ok, throws, spy, sleep } from '../../_lib/check.js';

export class Poller {
  constructor(poll, options = {}) {
    this.poll = poll;
    this.intervalMs = options.intervalMs ?? 1000;
    this.signal = options.signal;
  }

  async *[Symbol.asyncIterator]() {
    while (!this.signal?.aborted) {
      await sleep(this.intervalMs);
      if (this.signal?.aborted) return;
      yield await this.poll();
    }
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
