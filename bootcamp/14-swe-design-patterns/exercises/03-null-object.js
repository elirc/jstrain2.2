// ─────────────────────────────────────────────────────────────────────────
//  03 · null object                                         ★☆☆ warm-up
//  concepts: null object · optional collaborators · defaults
//  run: node exercises/03-null-object.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `runTask` is littered with `if (logger) logger.info(...)`. Kill the
//  ifs: when no logger is passed, substitute one that implements the
//  same interface and does nothing.
//
//      createNullLogger()  → { info(), warn(), error() }  all no-ops
//
//      runTask(task, logger?)
//        logs   `start ${task.name}`               (info)
//        on ok  logs `done ${task.name}`           (info)
//               returns { ok: true, result }
//        on throw logs `failed ${task.name}: ${message}`  (error)
//               returns { ok: false, error: message }
//
//  The body of runTask must contain no `if (logger)` check anywhere.
//
//  hint: `const log = logger ?? createNullLogger();` on line one

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createNullLogger() {
  throw new Error('TODO');
}

export function runTask(task, logger) {
  throw new Error('TODO');
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
