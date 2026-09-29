// ─────────────────────────────────────────────────────────────────────────
//  37 · graceful shutdown on SIGINT                          ★★★ stretch
//  concepts: signals · async cleanup · run-once guards · off()
//  run: node 37-sigint-shutdown.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Ctrl-C sends SIGINT. With no listener Node dies instantly, mid-write,
//  mid-request. A server that owns anything — an open port, a database
//  handle, a half-written file — installs a handler, finishes the work,
//  and only then exits.
//
//      const uninstall = installShutdown(target, cleanup);
//      target.emit('SIGINT');   // → cleanup(), awaited, then exit(0)
//      uninstall();             // → SIGINT does nothing again
//
//  `target` is anything with on/off/exit — the real `process` in
//  production, a fake in a test. Rules: cleanup runs at most ONCE no
//  matter how many signals arrive; exit(0) only after cleanup has
//  finished; exit(1) if cleanup throws or rejects; the returned function
//  removes the listener and leaves nothing behind.
//
//  hint: `off()` matches by function identity, so keep a reference to the
//  exact handler you registered. A module-level `let shuttingDown` flag
//  is what makes the second Ctrl-C a no-op instead of a second cleanup.

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

// Provided: a stand-in for `process` — same on/off/emit, plus an exit()
// that records instead of killing the test run.
function fakeProcess() {
  const target = new EventEmitter();
  target.exit = spy();
  return target;
}

export function installShutdown(target, cleanup) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('installs exactly one SIGINT listener and hands back an uninstall', () => {
  const target = fakeProcess();
  const uninstall = installShutdown(target, () => {});
  ok(typeof uninstall === 'function');
  eq(target.listenerCount('SIGINT'), 1);
  uninstall();
});

test('SIGINT runs the cleanup', async () => {
  const target = fakeProcess();
  const cleanup = spy();
  const uninstall = installShutdown(target, cleanup);
  target.emit('SIGINT');
  await sleep(10);
  eq(cleanup.callCount, 1);
  uninstall();
});

test('an async cleanup finishes before the exit', async () => {
  const log = [];
  const target = fakeProcess();
  target.exit = spy(() => log.push('exit'));
  const uninstall = installShutdown(target, async () => {
    log.push('cleanup start');
    await sleep(10);
    log.push('cleanup done');
  });
  target.emit('SIGINT');
  await sleep(50);
  eq(log, ['cleanup start', 'cleanup done', 'exit']);
  uninstall();
});

test('a clean shutdown exits with code 0', async () => {
  const target = fakeProcess();
  const uninstall = installShutdown(target, async () => {});
  target.emit('SIGINT');
  await sleep(20);
  eq(target.exit.calls, [[0]]);
  uninstall();
});

test('a cleanup that fails exits with code 1', async () => {
  const target = fakeProcess();
  const uninstall = installShutdown(target, async () => {
    throw new Error('could not flush');
  });
  target.emit('SIGINT');
  await sleep(20);
  eq(target.exit.calls, [[1]]);
  uninstall();
});

test('a second SIGINT does not run the cleanup twice', async () => {
  const target = fakeProcess();
  const cleanup = spy(async () => sleep(5));
  const uninstall = installShutdown(target, cleanup);
  target.emit('SIGINT');
  target.emit('SIGINT');
  await sleep(30);
  target.emit('SIGINT');
  await sleep(10);
  eq(cleanup.callCount, 1);
  uninstall();
});

test('uninstall removes the listener it added', async () => {
  const target = fakeProcess();
  const cleanup = spy();
  const uninstall = installShutdown(target, cleanup);
  uninstall();
  eq(target.listenerCount('SIGINT'), 0);
  target.emit('SIGINT');
  await sleep(10);
  eq(cleanup.callCount, 0);
});

test('it works on the real process object', async () => {
  const cleanup = spy();
  const exit = spy();
  const uninstall = installShutdown(
    {
      on: (name, handler) => process.on(name, handler),
      off: (name, handler) => process.off(name, handler),
      exit,
    },
    cleanup
  );
  try {
    process.emit('SIGINT');
    await sleep(20);
    eq(cleanup.callCount, 1);
    eq(exit.calls, [[0]]);
  } finally {
    uninstall();
  }
  eq(process.listenerCount('SIGINT'), 0);
});
