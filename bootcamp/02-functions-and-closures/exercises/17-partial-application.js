// ─────────────────────────────────────────────────────────────────────────
//  17 · partial application                                ★★☆ core
//  concepts: closures · rest and spread · configuration
//  run: node 17-partial-application.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Currying is rigid: one argument per call. Partial application is the
//  practical version — lock in as many leading arguments as you like now,
//  supply the rest later.
//
//      const log = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
//      const warn = partial(log, 'WARN');
//      warn('db', 'slow query')     → '[WARN] db: slow query'
//
//      const dbWarn = partial(log, 'WARN', 'db');
//      dbWarn('slow query')         → '[WARN] db: slow query'
//
//  Then use it: makeLogger(write, level) returns a one-argument logger
//  that calls write(level, message) — build it WITH partial, not by hand.
//
//      const warn = makeLogger(write, 'WARN');
//      warn('disk full')            → write('WARN', 'disk full')
//
//  hint: `(...later) => fn(...preset, ...later)`

import { test, eq, ok, spy } from '../../_lib/check.js';

export function partial(fn, ...preset) {
  throw new Error('TODO');
}

export function makeLogger(write, level) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('locks in the leading arguments', () => {
  const log = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
  eq(partial(log, 'WARN')('db', 'slow query'), '[WARN] db: slow query');
  eq(partial(log, 'WARN', 'db')('slow query'), '[WARN] db: slow query');
});

test('with no preset arguments it behaves like the original', () => {
  const add = (a, b) => a + b;
  const same = partial(add);
  ok(typeof same === 'function');
  eq(same(2, 3), 5);
});

test('later arguments arrive after the presets, in order', () => {
  const fn = spy((...args) => args);
  eq(partial(fn, 1, 2)(3, 4), [1, 2, 3, 4]);
  eq(fn.calls, [[1, 2, 3, 4]]);
});

test('nothing runs until the partial is called', () => {
  const fn = spy(() => 'ran');
  const ready = partial(fn, 'a');
  eq(fn.callCount, 0);
  ready();
  eq(fn.calls, [['a']]);
});

test('one partial serves many calls', () => {
  const join = (sep, ...parts) => parts.join(sep);
  const dashed = partial(join, '-');
  eq(dashed('a', 'b'), 'a-b');
  eq(dashed('x', 'y', 'z'), 'x-y-z');
});

test('makeLogger tags every message with its level', () => {
  const write = spy();
  const warn = makeLogger(write, 'WARN');
  warn('disk full');
  warn('still full');
  eq(write.calls, [
    ['WARN', 'disk full'],
    ['WARN', 'still full'],
  ]);
});

test('two loggers share a sink but keep their own level', () => {
  const write = spy();
  const warn = makeLogger(write, 'WARN');
  const info = makeLogger(write, 'INFO');
  info('starting');
  warn('uh oh');
  eq(write.calls, [
    ['INFO', 'starting'],
    ['WARN', 'uh oh'],
  ]);
  eq(write.callCount, 2);
});

test('makeLogger is built on partial', () => {
  const write = spy();
  makeLogger(write, 'INFO')('hello');
  ok(/partial\s*\(/.test(makeLogger.toString()), 'use partial() inside');
});
