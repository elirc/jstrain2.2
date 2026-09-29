// ─────────────────────────────────────────────────────────────────────────
//  25 · symbol keys                                         ★☆☆ warm-up
//  concepts: Symbol · unique keys · the global registry
//  run: node 25-symbol-keys.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You want to attach tracing metadata to objects you do not own. A string
//  key like 'traceId' can collide with the caller's own field; a Symbol
//  cannot — every Symbol() call mints a brand new key equal to nothing but
//  itself. Symbol.for() is the opposite: one shared key per label.
//
//      newTag('trace') !== newTag('trace')      → two different keys
//      sharedTag('app') === sharedTag('app')    → the same key, twice
//
//      const tag = newTag('trace');
//      const marked = stamp({ name: 'Ada' }, tag, 'abc123');
//      marked[tag]              → 'abc123'
//      Object.keys(marked)      → ['name']
//      JSON.stringify(marked)   → '{"name":"Ada"}'
//
//  stamp returns a NEW object; the one it was handed must not change.

import { test, eq, ok } from '../../_lib/check.js';

export function newTag(label) {
  throw new Error('TODO');
}

export function sharedTag(label) {
  throw new Error('TODO');
}

export function stamp(target, tag, value) {
  throw new Error('TODO');
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
