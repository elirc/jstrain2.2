// ─────────────────────────────────────────────────────────────────────────
//  04 · defaults are evaluated at call time                ★★☆ core
//  concepts: defaults · evaluation order · spies
//  run: node 04-defaults-at-call-time.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A default value is an EXPRESSION, re-evaluated on every call that
//  leaves the argument out (this is why JS has no Python-style mutable
//  default bug). Prove it twice:
//
//      collect(1)               → [1]        a brand new array each call
//      collect(2)               → [2]        …not the same array as above
//      collect('y', bucket)     → pushes into the bucket you passed
//
//      const record = makeRecorder(nextId);
//      record('save')           → { id: <nextId()>, text: 'save' }
//      record('save', 99)       → { id: 99, text: 'save' }  nextId unused
//
//  hint: `function record(text, id = nextId())` — the call happens per
//  invocation, not once when the function is created

import { test, eq, ok, spy } from '../../_lib/check.js';

export function collect(item, bucket = []) {
  throw new Error('TODO');
}

export function makeRecorder(nextId) {
  throw new Error('TODO');
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
