// ─────────────────────────────────────────────────────────────────────────
//  11 · expectMatchesShape — SOLUTION                           ★★☆ core
//  run: node 11-expect-shape.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: deep-equality on an API response is a test that fails every
//  time someone adds a field. A shape matcher asserts the CONTRACT — these
//  keys, these types, nested — and stays quiet about everything else. That
//  is the difference between testing behaviour and testing a snapshot of
//  today's payload.
//  The whole implementation is one recursive function with a `path` string
//  threaded through it, and the path is the point. `expected string, got
//  number` sends you grepping; `value.address.zip: expected string, got
//  number` sends you to the line. Build the path on the way DOWN — trying
//  to reconstruct it while an error propagates up is how people end up
//  catching and re-throwing at every level.
//  `gotType` exists because `typeof` lies twice: `typeof null` is 'object'
//  and `typeof []` is 'object'. A matcher that reports "expected object,
//  got object" is worse than no matcher, so null and arrays get their own
//  names — and the 'object' leaf deliberately rejects both.
//  Extra keys pass on purpose: the shape lists what you REQUIRE. Use 'any'
//  when a key must exist but its type is not this test's business.

import { test, eq } from '../../_lib/check.js';

// Provided: run fn, return the message it threw, or null if it did not.
function messageFrom(fn) {
  try {
    fn();
  } catch (error) {
    if (/^TODO\b/.test(error.message)) throw error;
    return error.message;
  }
  return null;
}

const gotType = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const matchesLeaf = (value, leaf) => {
  if (leaf === 'any') return true;
  if (leaf === 'null') return value === null;
  if (leaf === 'array') return Array.isArray(value);
  if (leaf === 'object') return gotType(value) === 'object';
  return typeof value === leaf;
};

export function expectMatchesShape(value, shape, path = 'value') {
  const fail = (want) => {
    throw new Error(`${path}: expected ${want}, got ${gotType(value)}`);
  };

  if (typeof shape === 'string') {
    if (!matchesLeaf(value, shape)) fail(shape);
    return;
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) fail('array');
    value.forEach((item, i) =>
      expectMatchesShape(item, shape[0], `${path}[${i}]`)
    );
    return;
  }
  if (gotType(value) !== 'object') fail('object');
  for (const key of Object.keys(shape)) {
    expectMatchesShape(value[key], shape[key], `${path}.${key}`);
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a matching flat object passes', () => {
  const shape = { id: 'number', name: 'string', active: 'boolean' };
  eq(
    messageFrom(() =>
      expectMatchesShape({ id: 1, name: 'Ada', active: true }, shape)
    ),
    null
  );
});

test('a wrong type names the key and both types', () => {
  eq(
    messageFrom(() => expectMatchesShape({ id: '1' }, { id: 'number' })),
    'value.id: expected number, got string'
  );
});

test('it recurses and reports the full path', () => {
  const shape = { address: { zip: 'string' } };
  eq(
    messageFrom(() => expectMatchesShape({ address: { zip: 90210 } }, shape)),
    'value.address.zip: expected string, got number'
  );
});

test('a missing key reads as undefined', () => {
  eq(
    messageFrom(() => expectMatchesShape({ id: 1 }, { email: 'string' })),
    'value.email: expected string, got undefined'
  );
});

test('an array shape checks every item, index included in the path', () => {
  eq(
    messageFrom(() =>
      expectMatchesShape({ tags: ['a', 'b', 3] }, { tags: ['string'] })
    ),
    'value.tags[2]: expected string, got number'
  );
  eq(
    messageFrom(() =>
      expectMatchesShape({ tags: ['a', 'b'] }, { tags: ['string'] })
    ),
    null
  );
});

test('an array shape rejects a non-array', () => {
  eq(
    messageFrom(() => expectMatchesShape({ tags: 'a,b' }, { tags: ['string'] })),
    'value.tags: expected array, got string'
  );
});

test('typeof null does not fool it, in either direction', () => {
  eq(
    messageFrom(() => expectMatchesShape({ meta: null }, { meta: 'object' })),
    'value.meta: expected object, got null'
  );
  eq(
    messageFrom(() => expectMatchesShape({ meta: null }, { meta: 'null' })),
    null
  );
  eq(
    messageFrom(() => expectMatchesShape({ meta: {} }, { meta: 'null' })),
    'value.meta: expected null, got object'
  );
});

test('extra keys are allowed, and "any" accepts anything', () => {
  const user = { id: 1, name: 'Ada', secret: 'x', meta: null };
  eq(messageFrom(() => expectMatchesShape(user, { id: 'number' })), null);
  eq(messageFrom(() => expectMatchesShape(user, { meta: 'any' })), null);
  eq(messageFrom(() => expectMatchesShape(user, { nope: 'any' })), null);
});
