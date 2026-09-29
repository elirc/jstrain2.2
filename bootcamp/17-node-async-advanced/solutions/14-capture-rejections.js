// ─────────────────────────────────────────────────────────────────────────
//  14 · captureRejections — SOLUTION                        ★★★ stretch
//  run: node 14-capture-rejections.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the constructor option is the whole mechanism. With it
//  on, emit() inspects what each listener returned and, if it is a
//  thenable, attaches a rejection handler that emits 'error' on the same
//  emitter. Without it, that promise is unreferenced and a rejection
//  becomes an unhandled rejection — which, since Node 15, terminates the
//  process. "My server dies once a day at 3 a.m." is very often an async
//  event listener nobody guarded.
//  The 'error' listener is not optional. An EventEmitter that emits
//  'error' with no listener THROWS the error instead, so switching
//  captureRejections on without wiring 'error' just moves the crash.
//  Note what is not covered: a listener that throws synchronously
//  returns no promise, so the throw propagates straight out of emit() to
//  whoever called it. Two different failure paths for two different
//  listener shapes — worth knowing before you rely on one of them.
//  Wrong turn: `bus.on('job', async () => …)` and assuming emit() waits.
//  It never does; emit is synchronous and returns before your listener's
//  first await resumes. If you need "all handlers finished", collect the
//  promises yourself instead of using an emitter.

import { test, eq, ok, throws, sleep } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

export function createBus() {
  const bus = new EventEmitter({ captureRejections: true });
  const errors = [];
  bus.on('error', (error) => errors.push(error)); // required, not optional
  return { bus, errors };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an async listener that resolves records nothing', async () => {
  const { bus, errors } = createBus();
  bus.on('job', async () => 'fine');
  bus.emit('job');
  await sleep(10);
  eq(errors, []);
});

test('an async listener that rejects lands in errors', async () => {
  const { bus, errors } = createBus();
  bus.on('job', async () => {
    throw new Error('db down');
  });
  bus.emit('job');
  await sleep(10);
  eq(errors.length, 1);
  eq(errors[0].message, 'db down');
});

test('the recorded value is the rejection reason itself', async () => {
  const { bus, errors } = createBus();
  const reason = new Error('the very same object');
  bus.on('job', async () => {
    throw reason;
  });
  bus.emit('job');
  await sleep(10);
  ok(errors[0] === reason, 'expected the identical Error instance');
});

test('the other listeners still run when one of them rejects', async () => {
  const { bus, errors } = createBus();
  const ran = [];
  bus.on('job', async () => {
    throw new Error('first failed');
  });
  bus.on('job', async () => {
    ran.push('second');
  });
  bus.emit('job');
  await sleep(10);
  eq(ran, ['second']);
  eq(errors.length, 1);
});

test('the rejection arrives later, not during emit()', async () => {
  const { bus, errors } = createBus();
  bus.on('job', async () => {
    throw new Error('later');
  });
  bus.emit('job');
  eq(errors.length, 0, 'emit() returns before the promise settles');
  await sleep(10);
  eq(errors.length, 1);
});

test('emit() reports whether anyone was listening', async () => {
  const { bus, errors } = createBus();
  eq(bus.emit('job'), false);
  bus.on('job', async () => 'ok');
  eq(bus.emit('job'), true);
  await sleep(10);
  eq(errors, []);
});

test('a listener that throws SYNCHRONOUSLY is not captured', async () => {
  const { bus, errors } = createBus();
  bus.on('job', () => {
    throw new Error('sync boom');
  });
  throws(() => bus.emit('job'), 'sync boom');
  await sleep(10);
  eq(errors, [], 'captureRejections only covers returned promises');
});
