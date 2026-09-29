// ─────────────────────────────────────────────────────────────────────────
//  15 · events as an async iterator                         ★★★ stretch
//  concepts: events.on · for await · AbortController · buffering
//  run: node 15-events-iterator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `events.once` gives you the NEXT event. `events.on` gives you all of
//  them, as an async iterable — which turns a callback firehose into an
//  ordinary loop you can await inside, with back-pressure for free.
//
//      for await (const args of on(emitter, 'tick', { signal })) {
//        // args is the argument array for one 'tick'
//      }
//
//  The loop never ends on its own, so an AbortSignal is how you get out —
//  and aborting makes the iterator THROW an AbortError. Catch it and
//  return what you collected:
//
//      const done = collectUntilAborted(emitter, 'tick', signal);
//      emitter.emit('tick', 1); emitter.emit('tick', 2);
//      controller.abort();
//      await done   → [1, 2]
//
//  Collect the first argument of each event, in order.
//
//  hint: the abort is expected, not exceptional — wrap the loop in
//  try/catch and treat an AbortError as "we are done"

import { test, eq, ok, sleep } from '../../_lib/check.js';
import { EventEmitter, on } from 'node:events';

// Returns a promise for the collected values.
export function collectUntilAborted(emitter, eventName, signal) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('collects the values emitted before the abort, in order', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 'a');
  await sleep(5);
  emitter.emit('tick', 'b');
  await sleep(5);
  controller.abort();
  eq(await collecting, ['a', 'b']);
});

test('a synchronous burst is buffered, not dropped', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 1);
  emitter.emit('tick', 2);
  emitter.emit('tick', 3);
  await sleep(5);
  controller.abort();
  eq(await collecting, [1, 2, 3]);
});

test('an abort with nothing emitted gives an empty list', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  controller.abort();
  eq(await collecting, []);
});

test('an already-aborted signal returns an empty list right away', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  controller.abort();
  eq(await collectUntilAborted(emitter, 'tick', controller.signal), []);
});

test('it unsubscribes when it stops', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 1);
  ok(emitter.listenerCount('tick') > 0, 'it should be listening while it runs');
  await sleep(5);
  controller.abort();
  await collecting;
  eq(emitter.listenerCount('tick'), 0);
});

test('the abort is swallowed — it resolves, it does not reject', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 'only');
  await sleep(5);
  controller.abort();
  const outcome = await collecting.then(
    (values) => values,
    (error) => `rejected: ${error.name}`
  );
  eq(outcome, ['only']);
});
