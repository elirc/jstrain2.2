// ─────────────────────────────────────────────────────────────────────────
//  27 · abortableDelay (AbortController) — SOLUTION        ★★☆ core
//  run: node 27-abortable-delay.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three states to handle. Already aborted — reject before
//  you start a timer at all, because abort events fired in the past will
//  never fire again. Aborted while waiting — clearTimeout so the process
//  is not held open, then reject with signal.reason. Completed normally
//  — removeEventListener, or the signal keeps a reference to a closure
//  that can never fire again.
//  That last one is the leak nobody notices: one long-lived signal
//  (a request scope, a component lifetime) plus a loop that adds a
//  listener per iteration is a growing array of dead closures. The test
//  checks the listener count for exactly this reason.
//  Wrong turn: rejecting with a fresh Error instead of signal.reason.
//  Callers check `err.name === 'AbortError'` to tell a cancellation
//  apart from a real failure, and a custom reason destroys that.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { getEventListeners } from 'node:events';

const since = (t0) => Date.now() - t0;

export function abortableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves after the delay when nothing aborts', async () => {
  const t0 = Date.now();
  await abortableDelay(20, new AbortController().signal);
  ok(since(t0) >= 15, `waited only ${since(t0)}ms`);
});

test('works without a signal at all', async () => {
  eq(await abortableDelay(10), undefined);
});

test('rejects when aborted while waiting', async () => {
  const c = new AbortController();
  const p = abortableDelay(100, c.signal);
  setTimeout(() => c.abort(new Error('user left')), 10);
  await rejects(p, 'user left');
});

test('rejects with the signal reason itself', async () => {
  const reason = new Error('stop now');
  const c = new AbortController();
  const p = abortableDelay(100, c.signal);
  c.abort(reason);
  const caught = await p.then(
    () => null,
    (e) => e
  );
  ok(caught === reason, 'reject with signal.reason, not a new Error');
});

test('rejects immediately if the signal is already aborted', async () => {
  const c = new AbortController();
  c.abort();
  const t0 = Date.now();
  const caught = await abortableDelay(300, c.signal).then(
    () => null,
    (e) => e
  );
  eq(caught.name, 'AbortError');
  ok(since(t0) < 50, 'do not start a timer for a dead signal');
});

test('removes its abort listener once it resolves', async () => {
  const c = new AbortController();
  await abortableDelay(10, c.signal);
  eq(getEventListeners(c.signal, 'abort').length, 0);
});
