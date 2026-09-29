// ─────────────────────────────────────────────────────────────────────────
//  11 · expectMatchesShape                                      ★★☆ core
//  concepts: structural matching · recursion · error paths
//  run: node 11-expect-shape.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Deep-equality on an API response breaks every time someone adds a field.
//  Assert the CONTRACT instead: these keys, these types, nested — and say
//  nothing about the rest.
//
//      expectMatchesShape({ id: 1, name: 'Ada' },
//                         { id: 'number', name: 'string' })    → passes
//
//      expectMatchesShape({ address: { zip: 90210 } },
//                         { address: { zip: 'string' } })      → throws
//          'value.address.zip: expected string, got number'
//
//      expectMatchesShape({ tags: ['a', 3] }, { tags: ['string'] })
//          'value.tags[1]: expected string, got number'
//
//  The shape language:
//      'string' 'number' 'boolean' 'function' 'undefined'  typeof checks
//      'null'      matches null and nothing else
//      'array'     matches any array
//      'object'    a real object: not null, not an array
//      'any'       matches anything
//      { k: shape } recurse into that key   [shape] every item matches
//
//  Message template, exactly — the root path is the word `value`:
//      `${path}: expected ${want}, got ${gotType(actual)}`
//  where gotType says 'null' for null, 'array' for arrays, else typeof.
//  Extra keys on the value are always fine. A missing key is 'undefined'.
//
//  hint: one recursive function with a `path` parameter defaulting to
//  'value'. Build the path on the way DOWN — `${path}.${key}` and
//  `${path}[${i}]` — so the error already knows where it happened.

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

export function expectMatchesShape(value, shape, path = 'value') {
  throw new Error('TODO');
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
