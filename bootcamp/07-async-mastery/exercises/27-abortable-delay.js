// ─────────────────────────────────────────────────────────────────────────
//  27 · abortableDelay (AbortController)                   ★★☆ core
//  concepts: AbortController · cancellation · listener cleanup
//  run: node 27-abortable-delay.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A timeout ignores work it no longer wants; cancellation stops it.
//  AbortController is the standard way to say "never mind" — fetch,
//  node:fs and node:http all take a `signal`.
//
//      const c = new AbortController();
//      const p = abortableDelay(100, c.signal);
//      c.abort(new Error('user left'));   → p rejects with that error
//
//  Rules: reject with `signal.reason` (whatever the caller passed to
//  abort), clear the pending timer when aborted, reject straight away if
//  the signal is ALREADY aborted, and remove your abort listener when
//  the delay completes normally. `signal` is optional.
//
//  hint: signal.addEventListener('abort', fn, { once: true })

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { getEventListeners } from 'node:events';

const since = (t0) => Date.now() - t0;

export function abortableDelay(ms, signal) {
  throw new Error('TODO');
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
