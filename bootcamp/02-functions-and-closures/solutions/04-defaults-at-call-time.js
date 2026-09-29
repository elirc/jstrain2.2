// ─────────────────────────────────────────────────────────────────────────
//  04 · defaults are evaluated at call time — SOLUTION     ★★☆ core
//  run: node 04-defaults-at-call-time.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `bucket = []` is not "a shared empty array", it is "run
//  `[]` now" — so every defaulted call allocates its own. Same rule makes
//  `id = nextId()` a lazy call: pass an id and the generator never fires,
//  which the spy proves (callCount 0). Returning a named inner function
//  from makeRecorder keeps `nextId` alive in the closure — that is the
//  bridge to the closure exercises coming up.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function collect(item, bucket = []) {
  bucket.push(item);
  return bucket;
}

export function makeRecorder(nextId) {
  return function record(text, id = nextId()) {
    return { id, text };
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('each call that omits the bucket gets a fresh array', () => {
  const a = collect(1);
  const b = collect(2);
  eq(a, [1]);
  eq(b, [2]);
  ok(a !== b, 'the two calls must not share one array');
});

test('a bucket you pass in is reused, not replaced', () => {
  const bucket = collect('x');
  collect('y', bucket);
  eq(bucket, ['x', 'y']);
});

test('the default expression runs on every call that omits it', () => {
  const nextId = spy(() => 7);
  const record = makeRecorder(nextId);
  eq(record('a'), { id: 7, text: 'a' });
  eq(record('b'), { id: 7, text: 'b' });
  eq(nextId.callCount, 2);
});

test('the default expression is skipped when an id is given', () => {
  const nextId = spy(() => 7);
  const record = makeRecorder(nextId);
  eq(record('a', 99), { id: 99, text: 'a' });
  eq(nextId.callCount, 0);
});

test('the generator is called with no arguments', () => {
  const nextId = spy(() => 1);
  const record = makeRecorder(nextId);
  record('a');
  eq(nextId.calls, [[]]);
});

test('two recorders keep their own generators', () => {
  let n = 0;
  const record = makeRecorder(() => (n += 1));
  const other = makeRecorder(() => 100);
  eq(record('a').id, 1);
  eq(other('b').id, 100);
  eq(record('c').id, 2);
});
