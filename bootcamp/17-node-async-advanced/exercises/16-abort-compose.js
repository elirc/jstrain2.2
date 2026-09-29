// ─────────────────────────────────────────────────────────────────────────
//  16 · composing AbortSignals                                 ★★☆ core
//  concepts: AbortSignal.timeout · AbortSignal.any · throwIfAborted
//  run: node 16-abort-compose.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A timeout only stops you WAITING. Cancellation stops the work. Node
//  ships two factories that make real cancellation composable:
//
//      deadline(50)            → a signal that aborts itself after 50 ms
//                                with a TimeoutError
//      firstOf([a, b])         → a signal that aborts when EITHER does,
//                                carrying that one's reason
//
//  Then use one to guard a chain of steps:
//
//      await runChain(steps, { signal, cleanup })
//        → ['load', 'transform', 'save']   the names that completed
//        → or throws signal.reason if the signal aborts partway
//        → cleanup() runs exactly once, either way
//
//  Each step is { name, run }, where run is async. Check the signal
//  before every step, so an abort during step 2 means step 3 never
//  starts.
//
//  hint: signal.throwIfAborted() is the one-liner for "stop here if we
//  have been cancelled"; a finally block is the one-liner for "cleanup
//  happens on both paths"

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';

export function deadline(ms) {
  throw new Error('TODO');
}

export function firstOf(signals) {
  throw new Error('TODO');
}

export async function runChain(steps, { signal, cleanup }) {
  throw new Error('TODO');
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
