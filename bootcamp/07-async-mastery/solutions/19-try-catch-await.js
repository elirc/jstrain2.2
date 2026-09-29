// ─────────────────────────────────────────────────────────────────────────
//  19 · safeLoad · mustLoad — SOLUTION                     ★★☆ core
//  run: node 19-try-catch-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `await` is the point where a rejected promise becomes a
//  thrown error, so try/catch around the await is all you need — no
//  .catch, no error-first callbacks, one error channel for sync and
//  async failures alike.
//  `throw` inside an async function does not throw to the caller; it
//  rejects the promise the function already returned. That is why
//  mustLoad's caller needs await + try/catch (or .catch) to see it.
//  Passing `{ cause: err }` keeps the original error attached instead of
//  flattening it to a string — free context when you debug at 2am.
//  Wrong turn: `try { return load(id); }` without await. The function
//  returns the pending promise, the try block ends, and the catch never
//  fires — the rejection escapes to the caller.

import { test, eq, ok, rejects } from '../../_lib/check.js';

const RECORDS = { r1: 'body of r1', r2: 'body of r2' };

export function loadRecord(id) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!(id in RECORDS)) reject(new Error(`no record ${id}`));
      else resolve({ id, body: RECORDS[id] });
    }, 5)
  );
}

export async function safeLoad(id) {
  try {
    return await loadRecord(id);
  } catch {
    return { id, missing: true };
  }
}

export async function mustLoad(id) {
  try {
    return await loadRecord(id);
  } catch (err) {
    throw new Error(`could not load ${id}: ${err.message}`, { cause: err });
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('safeLoad returns the record it found', async () => {
  eq(await safeLoad('r1'), { id: 'r1', body: 'body of r1' });
});

test('safeLoad falls back instead of rejecting', async () => {
  eq(await safeLoad('ghost'), { id: 'ghost', missing: true });
});

test('safeLoad never rejects', async () => {
  const outcome = await safeLoad('ghost').then(
    () => 'ok',
    () => 'rejected'
  );
  eq(outcome, 'ok');
});

test('mustLoad returns the record it found', async () => {
  eq(await mustLoad('r2'), { id: 'r2', body: 'body of r2' });
});

test('mustLoad rejects with a wrapped message', async () => {
  await rejects(mustLoad('ghost'), 'could not load ghost: no record ghost');
});

test('mustLoad keeps the original error as .cause', async () => {
  const err = await mustLoad('ghost').then(
    () => null,
    (e) => e
  );
  ok(err.cause instanceof Error, 'pass { cause: err } as the 2nd argument');
  eq(err.cause.message, 'no record ghost');
});

test('mustLoad rejects rather than throwing at the call site', () => {
  const p = mustLoad('ghost');
  ok(p instanceof Promise);
  p.catch(() => {});
});
