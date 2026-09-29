// ─────────────────────────────────────────────────────────────────────────
//  14 · captureRejections                                   ★★★ stretch
//  concepts: EventEmitter options · async listeners · 'error' routing
//  run: node 14-capture-rejections.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `emitter.on('job', async () => { … })` is a trap. emit() calls your
//  listener, gets a promise back, and throws it on the floor. When that
//  promise rejects there is nobody to catch it — Node prints
//  UnhandledPromiseRejection and kills the process.
//
//  `new EventEmitter({ captureRejections: true })` makes the emitter
//  watch the promises its listeners return and route a rejection to the
//  emitter's own 'error' event instead.
//
//      const { bus, errors } = createBus();
//      bus.on('job', async () => { throw new Error('db down'); });
//      bus.emit('job');
//      // a tick later: errors → [Error: db down]
//
//  Return the emitter AND an `errors` array that fills up with whatever
//  the 'error' event delivers. An emitter with no 'error' listener
//  re-throws, so wiring that listener is half the job.
//
//  hint: the option goes in the EventEmitter constructor; the array is
//  filled by an ordinary bus.on('error', …)

import { test, eq, ok, throws, sleep } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

export function createBus() {
  throw new Error('TODO');
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
