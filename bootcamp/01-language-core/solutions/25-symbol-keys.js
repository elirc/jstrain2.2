// ─────────────────────────────────────────────────────────────────────────
//  25 · symbol keys — SOLUTION                              ★☆☆ warm-up
//  run: node 25-symbol-keys.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Symbol(label)` is a constructor-shaped factory, not a
//  constructor — `new Symbol()` throws. The label is documentation only;
//  identity comes from the call itself, which is exactly the property that
//  makes a symbol safe as a key on somebody else's object.
//
//  `Symbol.for(label)` is the escape hatch: one process-wide registry keyed
//  by string, so two unrelated files can agree on a key on purpose.
//  `Symbol.keyFor` only answers for registry symbols.
//
//  Spread copies own ENUMERABLE properties, symbols included — which is why
//  `{ ...target, [tag]: value }` both copies and stamps in one expression.
//  The computed-key brackets are required: `{ tag: value }` would create a
//  string key named 'tag'.

import { test, eq, ok } from '../../_lib/check.js';

export function newTag(label) {
  return Symbol(label);
}

export function sharedTag(label) {
  return Symbol.for(label);
}

export function stamp(target, tag, value) {
  return { ...target, [tag]: value };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('every newTag is a fresh key, equal to nothing else', () => {
  const a = newTag('trace');
  const b = newTag('trace');
  eq(typeof a, 'symbol');
  ok(a !== b, 'same label, different symbols');
  ok(a === a);
});

test('the label is a description, not an identity', () => {
  const tag = newTag('trace');
  eq(tag.description, 'trace');
  eq(String(tag), 'Symbol(trace)');
  eq(newTag().description, undefined);
});

test('sharedTag hands back one symbol per label, from the registry', () => {
  ok(sharedTag('app') === sharedTag('app'), 'same label, same symbol');
  ok(sharedTag('app') !== sharedTag('other'));
  eq(Symbol.keyFor(sharedTag('app')), 'app');
  eq(Symbol.keyFor(newTag('app')), undefined);
});

test('stamp files the value under the symbol key', () => {
  const tag = newTag('trace');
  const marked = stamp({ name: 'Ada' }, tag, 'abc123');
  eq(marked[tag], 'abc123');
  eq(marked.name, 'Ada');
});

test('stamp copies — the original object is untouched', () => {
  const tag = newTag('trace');
  const source = Object.freeze({ name: 'Ada' });
  const marked = stamp(source, tag, 'abc123');
  ok(marked !== source, 'a new object');
  eq(source[tag], undefined);
});

test('a symbol key is invisible to Object.keys and to JSON', () => {
  const tag = newTag('trace');
  const marked = stamp({ name: 'Ada' }, tag, 'abc123');
  eq(Object.keys(marked), ['name']);
  eq(JSON.stringify(marked), '{"name":"Ada"}');
  eq(Object.entries(marked).length, 1);
});

test('two tags with the same label never collide', () => {
  const mine = newTag('id');
  const theirs = newTag('id');
  const marked = stamp(stamp({}, mine, 'mine'), theirs, 'theirs');
  eq(marked[mine], 'mine');
  eq(marked[theirs], 'theirs');
});

test('getOwnPropertySymbols finds the key when you ask for it', () => {
  const tag = newTag('trace');
  const marked = stamp({ name: 'Ada' }, tag, 'abc123');
  eq(Object.getOwnPropertySymbols(marked).length, 1);
  eq(Object.getOwnPropertySymbols(marked)[0], tag);
});
