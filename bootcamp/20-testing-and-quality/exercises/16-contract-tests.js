// ─────────────────────────────────────────────────────────────────────────
//  16 · contract tests                                       ★★★ stretch
//  concepts: interfaces · shared suites · substitutability
//  run: node 16-contract-tests.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You have an in-memory fake for fast tests and a real adapter for
//  production. The day they disagree, every test you own is a lie. A
//  CONTRACT TEST is one suite that takes a FACTORY and holds anything it
//  builds to the same standard — the shape behind testcontainers-style
//  suites and every "your driver must pass these tests" repo.
//
//      runContractTests(createMemoryStore)
//        → { passed: 10, failed: 0, failures: [] }
//      runContractTests(createLeakyStore)
//        → { passed: 8, failed: 2,
//            failures: [{ name: '...', message: '...' }, ...] }
//
//  The KV interface, in full:
//      get(key)     the value, or undefined
//      set(k, v)    stores it and returns THE STORE (so calls chain)
//      has(key)     boolean
//      delete(key)  true if the key was there, false if it was not
//      keys()       array of keys, in insertion order
//      size()       number of keys
//
//  Write TEN checks, each against a fresh `factory()`:
//      1 a fresh store is empty            6 has is true only for set keys
//      2 get on a missing key: undefined   7 a stored `undefined` is present
//      3 set then get                      8 delete reports if it existed
//      4 set returns the store             9 keys are in INSERTION order
//      5 overwrite does not grow size     10 inherited names are not keys
//  Use the provided `assert(cond, message)` so a failure explains itself.
//
//  Then write `createObjectStore` — same interface, backed by a plain
//  object instead of a Map — and make it pass the identical suite.
//  Checks 9 and 10 are where it gets interesting; `createLeakyStore` below
//  is the obvious version, and it fails both.
//
//  hint: run `Object.keys({ '2': 'b', '1': 'a' })` in your head, then for
//  real. And ask what `'toString' in {}` answers.

import { test, eq, ok } from '../../_lib/check.js';

// Provided: assert with a message you would want to read in a report.
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Provided: implementation A — a Map. The reference.
export function createMemoryStore() {
  const data = new Map();
  const store = {
    get: (key) => data.get(key),
    set(key, value) {
      data.set(key, value);
      return store;
    },
    has: (key) => data.has(key),
    delete: (key) => data.delete(key),
    keys: () => [...data.keys()],
    size: () => data.size,
  };
  return store;
}

// Provided: implementation C — plausible, and quietly wrong.
export function createLeakyStore() {
  const data = {};
  const store = {
    get: (key) => data[key],
    set(key, value) {
      data[key] = value;
      return store;
    },
    has: (key) => key in data,
    delete(key) {
      const had = key in data;
      delete data[key];
      return had;
    },
    keys: () => Object.keys(data),
    size: () => Object.keys(data).length,
  };
  return store;
}

// Implementation B — yours, backed by a plain object.
export function createObjectStore() {
  throw new Error('TODO');
}

export function runContractTests(factory) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the Map-backed store passes the whole contract', () => {
  const report = runContractTests(createMemoryStore);
  eq(report.failed, 0, JSON.stringify(report.failures));
  ok(report.passed >= 8, 'the contract needs at least 8 checks');
});

test('your object-backed store passes the SAME contract', () => {
  const report = runContractTests(createObjectStore);
  eq(report.failed, 0, JSON.stringify(report.failures));
  ok(report.passed >= 8, 'the contract needs at least 8 checks');
});

test('the leaky store fails the contract', () => {
  const report = runContractTests(createLeakyStore);
  ok(report.failed >= 1, 'a broken implementation must be caught');
  ok(report.passed >= 1, 'and it is not broken in every way');
});

test('a failure names the check and carries a message', () => {
  const { failures } = runContractTests(createLeakyStore);
  for (const failure of failures) {
    eq(typeof failure.name, 'string');
    eq(typeof failure.message, 'string');
    ok(failure.name.length > 0 && failure.message.length > 0);
  }
});

test('every check runs against a fresh store', () => {
  let made = 0;
  const counting = () => {
    made += 1;
    return createMemoryStore();
  };
  const report = runContractTests(counting);
  eq(made, report.passed + report.failed);
  ok(made >= 8, 'one factory call per check');
});

test('the object store keeps insertion order for integer-like keys', () => {
  const store = createObjectStore();
  store.set('2', 'b').set('1', 'a').set('x', 'c');
  eq(store.keys(), ['2', '1', 'x']);
  eq(createLeakyStore().set('2', 'b').set('1', 'a').keys(), ['1', '2']);
});

test('the object store is not fooled by inherited names', () => {
  const store = createObjectStore();
  eq(store.has('toString'), false);
  eq(store.get('toString'), undefined);
  store.set('toString', 'mine');
  eq(store.get('toString'), 'mine');
  eq(store.keys(), ['toString']);
  eq(createLeakyStore().has('toString'), true);
});

test('both good implementations agree, key for key', () => {
  const fill = (store) =>
    store.set('a', 1).set('b', 2).set('a', 3).set('c', undefined);
  const left = fill(createMemoryStore());
  const right = fill(createObjectStore());
  eq(left.keys(), right.keys());
  eq(left.size(), right.size());
  eq(left.delete('b'), right.delete('b'));
  eq(left.delete('b'), right.delete('b'));
  eq(left.keys(), right.keys());
});
