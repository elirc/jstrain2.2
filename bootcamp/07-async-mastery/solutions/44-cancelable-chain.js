// ─────────────────────────────────────────────────────────────────────────
//  44 · runSteps (a chain you can cancel) — SOLUTION       ★★★ stretch
//  run: node 44-cancelable-chain.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three separate jobs, and each one is a line of code.
//  1. Check `signal.aborted` at the TOP of every iteration, so an abort
//     that lands between steps stops the next one from ever starting.
//  2. Race the running step against a promise that rejects on 'abort'.
//     That is what makes cancellation work for a step that ignores the
//     signal — you stop WAITING for it. Its timer still runs; you cannot
//     un-run code, you can only stop caring about the answer.
//  3. Remove the listener in a `finally`. One listener per step on a
//     long-lived signal is exactly the leak that turns into
//     MaxListenersExceededWarning in a server.
//  Passing the signal down as well is not redundant: a signal-aware step
//  uses it to abort the real work (the socket, the timer), while the race
//  only protects the caller. Both halves are needed for real cancellation.
//  Reject with `signal.reason`, never a fresh Error — callers check
//  `err.name === 'AbortError'` to tell "cancelled" from "broken".
//  Wrong turn: `Promise.race([work, aborted])` without cleanup. Every
//  step leaves a listener and a promise that can never settle.

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';
import { getEventListeners } from 'node:events';

export const trace = [];
export const resetTrace = () => {
  trace.length = 0;
};

// A well-behaved step: cancels its own timer when the signal aborts.
export function makeStep(name, ms = 10) {
  return spy(
    (value, signal) =>
      new Promise((resolve, reject) => {
        trace.push(`${name}:start`);
        const onAbort = () => {
          clearTimeout(timer);
          trace.push(`${name}:cancelled`);
          reject(signal.reason);
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          trace.push(`${name}:done`);
          resolve(`${value}>${name}`);
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
      })
  );
}

// A legacy step: takes the signal and ignores it completely.
export function makeLegacyStep(name, ms = 60) {
  return spy(
    (value) =>
      new Promise((resolve) => {
        trace.push(`${name}:start`);
        setTimeout(() => {
          trace.push(`${name}:done`);
          resolve(`${value}>${name}`);
        }, ms);
      })
  );
}

export async function runSteps(steps, input, signal) {
  let value = input;

  for (const step of steps) {
    if (signal?.aborted) throw signal.reason;

    const work = step(value, signal);
    if (!signal) {
      value = await work;
      continue;
    }

    let onAbort;
    const aborted = new Promise((_, reject) => {
      onAbort = () => reject(signal.reason);
      signal.addEventListener('abort', onAbort, { once: true });
    });
    try {
      value = await Promise.race([work, aborted]);
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }

  return value;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('threads the value through every step in order', async () => {
  resetTrace();
  const c = new AbortController();
  const steps = [makeStep('a'), makeStep('b'), makeStep('c')];
  eq(await runSteps(steps, 'raw', c.signal), 'raw>a>b>c');
  eq(trace, ['a:start', 'a:done', 'b:start', 'b:done', 'c:start', 'c:done']);
});

test('hands the same signal to every step', async () => {
  resetTrace();
  const c = new AbortController();
  const steps = [makeStep('a'), makeStep('b')];
  await runSteps(steps, 'raw', c.signal);
  ok(steps.every((s) => s.calls[0][1] === c.signal));
});

test('rejects with the signal reason when aborted mid-chain', async () => {
  resetTrace();
  const c = new AbortController();
  const reason = new Error('user left');
  const p = runSteps([makeStep('a'), makeStep('b')], 'raw', c.signal);
  setTimeout(() => c.abort(reason), 12);
  const caught = await p.then(
    () => null,
    (e) => e
  );
  ok(caught === reason, 'reject with signal.reason, not a new Error');
});

test('never starts a later step after an abort', async () => {
  resetTrace();
  const c = new AbortController();
  const third = makeStep('c');
  const p = runSteps([makeStep('a'), makeStep('b'), third], 'raw', c.signal);
  setTimeout(() => c.abort(new Error('stop')), 12);
  await rejects(p, 'stop');
  eq(third.callCount, 0);
  ok(!trace.includes('c:start'));
});

test('rejects even when the running step ignores the signal', async () => {
  resetTrace();
  const c = new AbortController();
  const p = runSteps([makeLegacyStep('legacy', 60)], 'raw', c.signal);
  setTimeout(() => c.abort(new Error('stop')), 10);
  await rejects(p, 'stop');
  ok(
    !trace.includes('legacy:done'),
    'do not wait for a step that cannot be cancelled'
  );
});

test('leaves no abort listener behind, aborted or not', async () => {
  resetTrace();
  const clean = new AbortController();
  await runSteps([makeStep('a'), makeStep('b')], 'raw', clean.signal);
  eq(getEventListeners(clean.signal, 'abort').length, 0);

  const cancelled = new AbortController();
  const p = runSteps([makeStep('a', 40)], 'raw', cancelled.signal);
  setTimeout(() => cancelled.abort(new Error('stop')), 10);
  await rejects(p, 'stop');
  eq(getEventListeners(cancelled.signal, 'abort').length, 0);
});

test('an already-aborted signal runs no steps at all', async () => {
  resetTrace();
  const c = new AbortController();
  c.abort(new Error('never mind'));
  const first = makeStep('a');
  await rejects(runSteps([first, makeStep('b')], 'raw', c.signal), 'never mind');
  eq(first.callCount, 0);
});

test('works with no signal at all', async () => {
  resetTrace();
  eq(await runSteps([makeStep('a'), makeStep('b')], 'raw'), 'raw>a>b');
});
