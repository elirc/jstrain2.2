// ─────────────────────────────────────────────────────────────────────────
//  19 · safeLoad · mustLoad                                ★★☆ core
//  concepts: try/catch with await · rethrowing · error.cause
//  run: node 19-try-catch-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `await` turns a rejection into a thrown exception, which means the
//  ordinary try/catch you already know works on async code.
//
//      await safeLoad('r1')     → { id: 'r1', body: 'body of r1' }
//      await safeLoad('ghost')  → { id: 'ghost', missing: true }
//      await mustLoad('r1')     → { id: 'r1', body: 'body of r1' }
//      await mustLoad('ghost')  → rejects with Error('could not load
//                                 ghost: no record ghost')
//
//  safeLoad swallows the failure and returns a fallback. mustLoad wraps
//  it in a new Error with the original attached as `{ cause: err }` and
//  lets it fly. Both are async functions — throwing inside one rejects
//  its promise, it never throws at the call site.
//
//  hint: `try { return await load(id); } catch (err) { ... }`

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

export function safeLoad(id) {
  throw new Error('TODO');
}

export function mustLoad(id) {
  throw new Error('TODO');
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
