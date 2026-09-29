// ─────────────────────────────────────────────────────────────────────────
//  16 · composing AbortSignals — SOLUTION                      ★★☆ core
//  run: node 16-abort-compose.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: AbortSignal.timeout(ms) is a signal that aborts itself,
//  with a TimeoutError as the reason — so downstream code can tell "we
//  ran out of time" from "the user cancelled" by reading reason.name.
//  Its internal timer does not hold the process open, unlike a
//  setTimeout you write yourself.
//  AbortSignal.any([…]) is the composition operator you would otherwise
//  hand-roll with listeners: the result aborts when the FIRST input
//  does, inherits that input's reason, and is already aborted at
//  construction if any input already was. That is how a per-request
//  deadline and a server-shutdown signal become one thing to pass down.
//  runChain is the pattern behind every cancellable pipeline: check
//  between steps, throw the reason (never a generic Error — the reason
//  carries the WHY), and put the cleanup in a finally so both exits run
//  it exactly once. Note that this cancels between steps, not inside
//  one: real cancellation means handing the signal all the way down to
//  whatever is actually waiting.
//  Wrong turn: `Promise.race([work, timeout])`. The loser keeps running,
//  keeps its socket open and still writes its result somewhere — you
//  stopped listening, you did not stop the work.

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';

export function deadline(ms) {
  return AbortSignal.timeout(ms);
}

export function firstOf(signals) {
  return AbortSignal.any(signals);
}

export async function runChain(steps, { signal, cleanup }) {
  const done = [];
  try {
    for (const step of steps) {
      signal.throwIfAborted(); // stop before starting the next one
      await step.run();
      done.push(step.name);
    }
    return done;
  } finally {
    cleanup();
  }
}

// Provided: a step that records that it ran, and can do something extra.
const makeStep = (name, ran, extra) => ({
  name,
  run: async () => {
    await sleep(1);
    ran.push(name);
    if (extra) extra();
  },
});

// ──────────────────────────── tests ──────────────────────────────────────

test('deadline() gives a signal that has not fired yet', () => {
  const signal = deadline(50);
  ok(signal instanceof AbortSignal, 'expected an AbortSignal');
  eq(signal.aborted, false);
});

test('the deadline signal aborts itself with a TimeoutError', async () => {
  const signal = deadline(20);
  await sleep(45);
  eq(signal.aborted, true);
  eq(signal.reason.name, 'TimeoutError');
});

test('firstOf aborts as soon as one input does, with its reason', () => {
  const slow = new AbortController();
  const fast = new AbortController();
  const combined = firstOf([slow.signal, fast.signal]);
  eq(combined.aborted, false);
  fast.abort(new Error('user navigated away'));
  eq(combined.aborted, true);
  eq(combined.reason.message, 'user navigated away');
});

test('firstOf is already aborted when one input already is', () => {
  const done = new AbortController();
  done.abort(new Error('too late'));
  const combined = firstOf([done.signal, new AbortController().signal]);
  eq(combined.aborted, true);
  eq(combined.reason.message, 'too late');
});

test('runChain runs every step and returns their names', async () => {
  const ran = [];
  const steps = ['load', 'transform', 'save'].map((n) => makeStep(n, ran));
  const signal = new AbortController().signal;
  eq(await runChain(steps, { signal, cleanup: () => {} }), [
    'load',
    'transform',
    'save',
  ]);
  eq(ran, ['load', 'transform', 'save']);
});

test('cleanup runs exactly once on the happy path', async () => {
  const ran = [];
  const cleanup = spy();
  const signal = new AbortController().signal;
  await runChain([makeStep('only', ran)], { signal, cleanup });
  eq(cleanup.callCount, 1);
});

test('an abort partway through stops the next step', async () => {
  const ran = [];
  const controller = new AbortController();
  const steps = [
    makeStep('one', ran),
    makeStep('two', ran, () => controller.abort(new Error('cancelled'))),
    makeStep('three', ran),
  ];
  await rejects(
    () => runChain(steps, { signal: controller.signal, cleanup: () => {} }),
    'cancelled'
  );
  eq(ran, ['one', 'two']);
});

test('cleanup still runs when the chain is aborted', async () => {
  const ran = [];
  const cleanup = spy();
  const controller = new AbortController();
  const steps = [
    makeStep('one', ran, () => controller.abort(new Error('stop'))),
    makeStep('two', ran),
  ];
  await rejects(() => runChain(steps, { signal: controller.signal, cleanup }));
  eq(cleanup.callCount, 1);
  eq(ran, ['one']);
});
