// ─────────────────────────────────────────────────────────────────────────
//  44 · runSteps (a chain you can cancel)                  ★★★ stretch
//  concepts: AbortSignal · composition · listener hygiene
//  run: node 44-cancelable-chain.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A three-step import — fetch → transform → save — that must stop the
//  moment the user navigates away, including mid-step, including when the
//  step is old code that has never heard of AbortSignal.
//  Build `runSteps(steps, input, signal)`:
//
//      await runSteps([fetchIt, parseIt, saveIt], 'raw', signal)
//      → 'raw>fetchIt>parseIt>saveIt'
//
//  Rules:
//    · each step is `(value, signal) => Promise`; the value is threaded
//      through, and every step gets the SAME signal
//    · once the signal aborts, reject with `signal.reason` RIGHT AWAY —
//      even if the running step ignores the signal and keeps going
//    · a later step must never start after an abort
//    · leave no 'abort' listener behind on any path
//    · `signal` may be undefined
//
//  hint: race the step against a promise that rejects on 'abort' — and
//  put the removeEventListener in a `finally`, or you have built the leak
//  this exercise is about.

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

export function runSteps(steps, input, signal) {
  throw new Error('TODO');
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
