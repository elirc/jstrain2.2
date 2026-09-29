// ─────────────────────────────────────────────────────────────────────────
//  27 · the disposer pattern                                ★★★ stretch
//  concepts: acquire/use/release · async finally · suppressed errors
//  run: node 27-with-resource.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 03 closed a file synchronously. Real resources — a pooled
//  connection, a lock, a temp directory — are acquired and released
//  with awaits, and every `await` is a place the function can leave
//  early. One helper owns the guarantee so no caller has to.
//
//    withResource(acquire, use, release) — async
//        const handle = await acquire();
//        the value of `await use(handle)` is what you return
//        release(handle) runs on EVERY path out, and is awaited
//
//    the rules that are easy to get wrong:
//      · acquire failing means there is nothing to release — release
//        must NOT be called
//      · release is awaited, so withResource never resolves while the
//        resource is still open
//      · if use fails and release fails too, the USE error is the one
//        that escapes; the release failure rides along as
//        err.releaseError, because two failures must not become one
//
//  hint: `finally` is the shape. Remember that a `return` or a bare
//  `throw` inside finally REPLACES whatever the try was doing — which
//  is exactly the bug the last rule is there to prevent.

import { test, eq, spy, sleep } from '../../_lib/check.js';

export async function withResource(acquire, use, release) {
  throw new Error('TODO');
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
