// ─────────────────────────────────────────────────────────────────────────
//  03 · null object — SOLUTION                              ★☆☆ warm-up
//  concepts: null object · optional collaborators · defaults
//  run: node solutions/03-null-object.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — replace "absent collaborator" with an object of the same
//  shape that does nothing, so callers never branch on null. One `??` at
//  the top buys you an if-free body; the "does it exist?" question is
//  answered once instead of at every call site.
//  When NOT to use: when absence is *meaningful* (a missing payment
//  provider must fail loudly, not silently no-op). A null object that
//  swallows a real error is a bug factory.
//  In the wild: `console` shims in libraries, no-op metrics clients,
//  React's default context value, `Array.prototype.map` on `[]`.
//  Classic wrong turn: `logger = logger || {}` — the interface is gone,
//  and the first `logger.info(...)` explodes.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createNullLogger() {
  const noop = () => {};
  return { info: noop, warn: noop, error: noop };
}

export function runTask(task, logger) {
  const log = logger ?? createNullLogger();
  log.info(`start ${task.name}`);
  try {
    const result = task.run();
    log.info(`done ${task.name}`);
    return { ok: true, result };
  } catch (error) {
    log.error(`failed ${task.name}: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

const fakeLogger = () => ({ info: spy(), warn: spy(), error: spy() });

// ──────────────────────────── tests ──────────────────────────────────────

test('the null logger implements the whole interface', () => {
  const log = createNullLogger();
  for (const method of ['info', 'warn', 'error']) {
    ok(typeof log[method] === 'function', `missing ${method}`);
    eq(log[method]('anything'), undefined);
  }
});

test('a successful task returns its result', () => {
  eq(runTask({ name: 'sync', run: () => 42 }, fakeLogger()), {
    ok: true,
    result: 42,
  });
});

test('a successful task logs start and done', () => {
  const log = fakeLogger();
  runTask({ name: 'sync', run: () => 42 }, log);
  eq(log.info.calls, [['start sync'], ['done sync']]);
  eq(log.error.callCount, 0);
});

test('a throwing task is caught, not propagated', () => {
  eq(runTask({ name: 'sync', run: () => { throw new Error('boom'); } }, fakeLogger()), {
    ok: false,
    error: 'boom',
  });
});

test('a throwing task logs through error, and never logs done', () => {
  const log = fakeLogger();
  runTask({ name: 'sync', run: () => { throw new Error('boom'); } }, log);
  eq(log.error.calls, [['failed sync: boom']]);
  eq(log.info.calls, [['start sync']]);
});

test('no logger at all still works', () => {
  eq(runTask({ name: 'quiet', run: () => 'ok' }), { ok: true, result: 'ok' });
  eq(runTask({ name: 'quiet', run: () => { throw new Error('x'); } }), {
    ok: false,
    error: 'x',
  });
});
