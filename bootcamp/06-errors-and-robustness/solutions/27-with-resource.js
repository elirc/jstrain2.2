// ─────────────────────────────────────────────────────────────────────────
//  27 · the disposer pattern — SOLUTION                     ★★★ stretch
//  run: node 27-with-resource.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `await acquire()` sits OUTSIDE the try on purpose. If
//  acquiring fails there is no handle, and calling release(undefined)
//  is how a cleanup path turns one clear error ('pool exhausted') into
//  a confusing TypeError inside a finally block.
//  Inside, `return await use(handle)` — the `await` is not redundant
//  here. Without it the function returns the promise and leaves the try
//  block immediately, so the finally would run BEFORE the work
//  finished and release a resource still in use.
//  The finally does the interesting part. `await release(handle)` keeps
//  the caller waiting until the resource is really closed. Wrapping it
//  in its own try means a broken release cannot escape and replace an
//  in-flight error: if `use` already failed, the release failure is
//  attached as `err.releaseError` and the original keeps travelling; if
//  it did not, there is nothing to protect and the release error is the
//  news, so it throws.
//  Classic wrong turn: a bare `throw` (or `return`) in finally. It
//  silently discards whatever the try was doing — the README's rule 3,
//  and the reason a failed rollback so often hides the failed query.

import { test, eq, spy, sleep } from '../../_lib/check.js';

export async function withResource(acquire, use, release) {
  const handle = await acquire();
  let failure;
  try {
    return await use(handle);
  } catch (err) {
    failure = err;
    throw err;
  } finally {
    try {
      await release(handle);
    } catch (releaseError) {
      if (failure instanceof Error) failure.releaseError = releaseError;
      else if (!failure) throw releaseError;
    }
  }
}

// ── given: test fixtures & helpers ───────────────────────────────────────

// a connection that records what happens to it
function makeConnection(log) {
  return {
    async acquire() {
      log.push('acquire');
      return { id: 'conn-1', log };
    },
    async release(handle) {
      await sleep(5);
      handle.log.push('release');
    },
  };
}

// returns the error an async fn rejected with, so a test can inspect it
async function rejectedBy(fn) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to reject, but it resolved');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns whatever use produced', async () => {
  const log = [];
  const conn = makeConnection(log);
  const rows = await withResource(
    conn.acquire,
    async () => ['a', 'b'],
    conn.release
  );
  eq(rows, ['a', 'b']);
});

test('acquire, then use, then release', async () => {
  const log = [];
  const conn = makeConnection(log);
  await withResource(
    conn.acquire,
    async (handle) => {
      handle.log.push('use');
      return 'ok';
    },
    conn.release
  );
  eq(log, ['acquire', 'use', 'release']);
});

test('release is awaited — it is closed before we return', async () => {
  const log = [];
  const conn = makeConnection(log);
  await withResource(conn.acquire, async () => 'ok', conn.release);
  eq(log, ['acquire', 'release']);
});

test('releases even when use rejects, and the error escapes', async () => {
  const log = [];
  const conn = makeConnection(log);
  const err = await rejectedBy(() =>
    withResource(
      conn.acquire,
      async () => {
        throw new Error('query failed');
      },
      conn.release
    )
  );
  eq(err.message, 'query failed');
  eq(log, ['acquire', 'release']);
});

test('releases when use throws synchronously too', async () => {
  const log = [];
  const conn = makeConnection(log);
  await rejectedBy(() =>
    withResource(
      conn.acquire,
      () => {
        throw new Error('bad SQL');
      },
      conn.release
    )
  );
  eq(log, ['acquire', 'release']);
});

test('does not release when acquire fails', async () => {
  const release = spy(async () => {});
  const err = await rejectedBy(() =>
    withResource(
      async () => {
        throw new Error('pool exhausted');
      },
      async () => 'never',
      release
    )
  );
  eq(err.message, 'pool exhausted');
  eq(release.callCount, 0);
});

test('a release failure on the happy path still escapes', async () => {
  const err = await rejectedBy(() =>
    withResource(
      async () => 'conn',
      async () => 'rows',
      async () => {
        throw new Error('close failed');
      }
    )
  );
  eq(err.message, 'close failed');
});

test('a release failure never masks the use failure', async () => {
  const err = await rejectedBy(() =>
    withResource(
      async () => 'conn',
      async () => {
        throw new Error('query failed');
      },
      async () => {
        throw new Error('close failed');
      }
    )
  );
  eq(err.message, 'query failed');
  eq(err.releaseError.message, 'close failed');
});
