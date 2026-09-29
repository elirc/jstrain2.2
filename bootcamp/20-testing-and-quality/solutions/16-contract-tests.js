// ─────────────────────────────────────────────────────────────────────────
//  16 · contract tests — SOLUTION                            ★★★ stretch
//  run: node 16-contract-tests.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the suite takes a FACTORY, not a store. That one parameter
//  is what turns a test file into a contract: anything that can be built
//  can be checked, so the in-memory fake used by 200 fast unit tests and
//  the real Redis/SQL adapter are held to the identical standard. This is
//  how teams keep a fake honest, and it is the shape behind
//  testcontainers-style suites — same tests, different backing.
//  Each check calls `factory()` itself, so no check can be poisoned by a
//  previous one. Sharing one store across checks is the single fastest way
//  to build a suite that passes in order and fails when you run one test
//  alone.
//  The object store is where the contract earns its keep. `{}` inherits
//  from Object.prototype, so `'toString' in data` is TRUE on an empty
//  store — `Object.create(null)` is the fix. And `Object.keys` sorts
//  integer-like keys ahead of everything else regardless of insertion
//  order, so '2' before '1' is impossible to honour with a bare object;
//  the insertion order has to be tracked separately. A Map has both
//  properties for free, which is exactly why the contract found the
//  difference and a Map-only test suite never would.
//  Notice the checks assert BEHAVIOUR (`delete` returns whether it existed)
//  and never touch internals. A contract that inspected `store.data` would
//  be unimplementable by half the implementations it is supposed to hold.

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
  const data = Object.create(null);
  const order = [];
  const store = {
    get: (key) => data[key],
    set(key, value) {
      if (!(key in data)) order.push(key);
      data[key] = value;
      return store;
    },
    has: (key) => key in data,
    delete(key) {
      if (!(key in data)) return false;
      delete data[key];
      order.splice(order.indexOf(key), 1);
      return true;
    },
    keys: () => [...order],
    size: () => order.length,
  };
  return store;
}

export function runContractTests(factory) {
  const checks = [
    [
      'a fresh store is empty',
      (s) => {
        assert(s.size() === 0, `size() should be 0, got ${s.size()}`);
        assert(s.keys().length === 0, 'keys() should be empty');
      },
    ],
    [
      'get on a missing key is undefined',
      (s) => assert(s.get('nope') === undefined, 'missing get must be undefined'),
    ],
    [
      'set then get returns the value',
      (s) => {
        s.set('a', 1);
        assert(s.get('a') === 1, `get('a') should be 1, got ${s.get('a')}`);
        assert(s.size() === 1, 'size() should be 1 after one set');
      },
    ],
    [
      'set returns the store so calls chain',
      (s) => {
        const returned = s.set('a', 1);
        assert(returned === s, 'set must return the store itself');
        s.set('b', 2).set('c', 3);
        assert(s.size() === 3, 'chained sets should all land');
      },
    ],
    [
      'setting an existing key overwrites without growing',
      (s) => {
        s.set('a', 1).set('a', 2);
        assert(s.get('a') === 2, 'the second set should win');
        assert(s.size() === 1, `size() should still be 1, got ${s.size()}`);
        assert(s.keys().length === 1, 'the key should not be duplicated');
      },
    ],
    [
      'has is true only for keys that were set',
      (s) => {
        s.set('a', 1);
        assert(s.has('a') === true, "has('a') should be true");
        assert(s.has('b') === false, "has('b') should be false");
      },
    ],
    [
      'a stored undefined still counts as present',
      (s) => {
        s.set('a', undefined);
        assert(s.has('a') === true, 'has must not be implemented as get()');
        assert(s.size() === 1, 'size should count a key holding undefined');
      },
    ],
    [
      'delete reports whether the key was there',
      (s) => {
        s.set('a', 1);
        assert(s.delete('a') === true, 'deleting a present key returns true');
        assert(s.delete('a') === false, 'deleting it again returns false');
        assert(s.has('a') === false, 'the key should be gone');
        assert(s.size() === 0, 'size should drop back to 0');
      },
    ],
    [
      'keys come back in insertion order',
      (s) => {
        s.set('2', 'b').set('1', 'a').set('x', 'c');
        const keys = s.keys();
        assert(
          keys.join(',') === '2,1,x',
          `keys() should be 2,1,x — got ${keys.join(',')}`
        );
      },
    ],
    [
      'inherited property names are not keys',
      (s) => {
        assert(s.has('toString') === false, "has('toString') must be false");
        assert(s.get('toString') === undefined, 'get must not find a method');
        assert(s.size() === 0, 'an empty store has no inherited keys');
      },
    ],
  ];

  let passed = 0;
  const failures = [];
  for (const [name, check] of checks) {
    try {
      check(factory());
      passed += 1;
    } catch (error) {
      failures.push({ name, message: error.message });
    }
  }
  return { passed, failed: failures.length, failures };
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
