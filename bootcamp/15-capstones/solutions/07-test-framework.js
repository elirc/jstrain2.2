// ─────────────────────────────────────────────────────────────────────────
//  07 · test framework — SOLUTION                           ★★★ capstone
//  concepts: trees · recursion · module state · error handling
//  time: 35–45 min · 4 stages · 23 tests
//  run: node 07-test-framework.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Two phases, and every test framework you have ever used
//  works this way:
//    · COLLECT — importing the file executes describe() and it(), which
//      build a tree of suites. Nothing is executed yet; `it` only stores
//      a name and a function.
//    · RUN — walk the tree recursively, call each function inside a
//      try/catch, and turn thrown errors into a report.
//  The seam between the two is why `--watch`, `.only`, random order and
//  parallel workers are possible at all: by the time anything runs, the
//  whole plan is data.
//
//  Stage 1 — `run` returns a report and prints nothing. Printing is a
//  reporter's job; keeping it out means the runner is testable (which is
//  exactly what these tests are doing) and reusable. Note that run()
//  resets the tree afterwards, so each of the tests below starts clean.
//
//  Stage 2 — an assertion is just a function that throws. That is the
//  entire trick of expect(): `toBe` compares with Object.is and throws a
//  message; the runner's catch does the rest. Object.is rather than ===
//  gives you NaN === NaN (useful) and 0 !== -0 (pedantic but correct).
//  Real frameworks throw a dedicated AssertionError subclass so a reporter
//  can tell "this assertion failed" from "your code exploded"; a plain
//  Error is enough here.
//
//  Stage 3 — describe() is the CURRENT-NODE pattern: point a module-level
//  `current` at the new suite, run the callback (so nested describes land
//  inside it), then restore the pointer in a `finally`. No arguments are
//  threaded anywhere, which is why `it` inside a describe just works. The
//  same trick powers React hooks and most dependency-injection containers.
//
//  Stage 4 — toThrow has to run the function itself and catch, and it must
//  distinguish "did not throw" from "threw the wrong thing", because those
//  are different bugs. And a rude test can throw a string, a number or
//  null: `error instanceof Error ? error.message : String(error)` keeps
//  the runner from crashing on the very thing it exists to catch.
//
//  Classic wrong turn: making `it` execute the test immediately. It looks
//  identical for a flat file, then a describe cannot report anything about
//  its children, `.only` becomes impossible, and a failure in collection
//  takes the whole run down.

import { test, eq } from '../../_lib/check.js';

// provided — how values are shown inside failure messages.
const format = (value) => JSON.stringify(value) ?? String(value);

// stage 1 + 3 — the collected tree.
const makeSuite = (name) => ({ name, tests: [], suites: [] });
let root = makeSuite('');
let current = root;

// stage 3 — swap the current node, restore it no matter what.
export function describe(name, fn) {
  const suite = makeSuite(name);
  current.suites.push(suite);
  const parent = current;
  current = suite;
  try {
    fn();
  } finally {
    current = parent;
  }
}

// stage 1 — collect, never execute.
export function it(name, fn) {
  current.tests.push({ name, fn });
}

// stage 2 — Object.is at the leaves; same shape, same length, same keys.
export function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
}

// stages 2 + 4 — an assertion is a function that throws on failure.
export function expect(actual) {
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) {
        throw new Error(
          `expected ${format(expected)} but got ${format(actual)}`
        );
      }
    },

    toEqual(expected) {
      if (!deepEqual(actual, expected)) {
        throw new Error(
          `expected ${format(expected)} but got ${format(actual)}`
        );
      }
    },

    toThrow(match) {
      let thrown;
      let threw = false;
      try {
        actual();
      } catch (error) {
        threw = true;
        thrown = error;
      }
      if (!threw) throw new Error('expected the function to throw');
      if (match === undefined) return;
      const message = messageOf(thrown);
      const hit =
        match instanceof RegExp ? match.test(message) : message.includes(match);
      if (!hit) {
        throw new Error(`expected the error to match ${match}, got: ${message}`);
      }
    },
  };
}

// stage 4 — tests are allowed to throw things that are not Errors.
const messageOf = (thrown) =>
  thrown instanceof Error ? thrown.message : String(thrown);

// stage 1 + 3 — depth-first: own tests, then child suites.
function runSuite(suite, ancestors, report) {
  const path = suite.name === '' ? ancestors : [...ancestors, suite.name];
  for (const { name, fn } of suite.tests) {
    try {
      fn();
      report.passed += 1;
    } catch (error) {
      report.failed += 1;
      report.failures.push({
        path: [...path, name].join(' > '),
        message: messageOf(error),
      });
    }
  }
  for (const child of suite.suites) runSuite(child, path, report);
}

export function run() {
  const report = { passed: 0, failed: 0, failures: [] };
  runSuite(root, [], report);
  root = makeSuite(''); // collect nothing twice
  current = root;
  return report;
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: it + run ────────────────────────────────────────────────────

test('run reports a passing test', () => {
  it('works', () => {});
  const report = run();
  eq(report.passed, 1);
  eq(report.failed, 0);
  eq(report.failures, []);
});

test('a test that throws is counted as a failure', () => {
  it('breaks', () => {
    throw new Error('nope');
  });
  const report = run();
  eq(report.passed, 0);
  eq(report.failed, 1);
});

test('a failure carries the test name and the message', () => {
  it('breaks', () => {
    throw new Error('nope');
  });
  eq(run().failures, [{ path: 'breaks', message: 'nope' }]);
});

test('passes and failures are counted together', () => {
  it('a', () => {});
  it('b', () => {
    throw new Error('x');
  });
  it('c', () => {});
  const report = run();
  eq(report.passed, 2);
  eq(report.failed, 1);
});

test('running nothing reports zeroes', () => {
  eq(run(), { passed: 0, failed: 0, failures: [] });
});

test('run clears the collected tests', () => {
  it('once', () => {});
  eq(run().passed, 1);
  eq(run().passed, 0);
});

// ── stage 2: expect, toBe and toEqual ────────────────────────────────────

test('toBe passes on equal primitives and fails on different ones', () => {
  it('same', () => expect(1).toBe(1));
  it('different', () => expect(1).toBe(2));
  const report = run();
  eq(report.passed, 1);
  eq(report.failed, 1);
  eq(report.failures[0].message, 'expected 2 but got 1');
});

test('toBe compares with Object.is, so NaN equals NaN', () => {
  it('nan', () => expect(NaN).toBe(NaN));
  it('zeroes', () => expect(0).toBe(-0));
  const report = run();
  eq(report.passed, 1);
  eq(report.failed, 1);
});

test('toBe fails for two structurally equal objects', () => {
  it('objects', () => expect({ a: 1 }).toBe({ a: 1 }));
  eq(run().failed, 1);
});

test('toEqual passes for deeply equal structures', () => {
  it('deep', () => expect({ a: [1, { b: 2 }] }).toEqual({ a: [1, { b: 2 }] }));
  eq(run().passed, 1);
});

test('a toEqual failure shows both values', () => {
  it('deep', () => expect({ a: 1 }).toEqual({ a: 2 }));
  eq(run().failures[0].message, 'expected {"a":2} but got {"a":1}');
});

test('deepEqual handles nesting, lengths and key counts', () => {
  eq(deepEqual([1, [2, 3]], [1, [2, 3]]), true);
  eq(deepEqual([1, 2], [1, 2, 3]), false);
  eq(deepEqual({ a: 1 }, { a: 1, b: undefined }), false);
  eq(deepEqual(null, null), true);
  eq(deepEqual(null, {}), false);
  eq(deepEqual('1', 1), false);
});

// ── stage 3: describe and the failure path ───────────────────────────────

test('a describe name is part of the path', () => {
  describe('math', () => {
    it('adds', () => {
      throw new Error('x');
    });
  });
  eq(run().failures[0].path, 'math > adds');
});

test('describes nest as deep as you like', () => {
  describe('a', () => {
    describe('b', () => {
      it('c', () => {
        throw new Error('x');
      });
    });
  });
  eq(run().failures[0].path, 'a > b > c');
});

test('sibling describes keep their own paths', () => {
  describe('a', () =>
    it('x', () => {
      throw new Error('1');
    }));
  describe('b', () =>
    it('x', () => {
      throw new Error('2');
    }));
  eq(run().failures.map((f) => f.path), ['a > x', 'b > x']);
});

test('a suite runs its own tests before its nested suites', () => {
  const order = [];
  describe('outer', () => {
    it('own 1', () => order.push('own 1'));
    describe('inner', () => {
      it('nested', () => order.push('nested'));
    });
    it('own 2', () => order.push('own 2'));
  });
  run();
  eq(order, ['own 1', 'own 2', 'nested']);
});

test('an empty describe contributes nothing', () => {
  describe('empty', () => {});
  eq(run(), { passed: 0, failed: 0, failures: [] });
});

// ── stage 4: toThrow, and surviving rude tests ───────────────────────────

test('toThrow passes when the function throws', () => {
  it('throws', () =>
    expect(() => {
      throw new Error('boom');
    }).toThrow());
  eq(run().passed, 1);
});

test('toThrow fails when nothing is thrown', () => {
  it('quiet', () => expect(() => 'fine').toThrow());
  const report = run();
  eq(report.failed, 1);
  eq(report.failures[0].message, 'expected the function to throw');
});

test('toThrow can require a substring of the message', () => {
  const boom = () => {
    throw new Error('boom town');
  };
  it('match', () => expect(boom).toThrow('boom'));
  it('mismatch', () => expect(boom).toThrow('bang'));
  const report = run();
  eq(report.passed, 1);
  eq(report.failed, 1);
  eq(report.failures[0].message,
    'expected the error to match bang, got: boom town');
});

test('toThrow accepts a RegExp too', () => {
  it('regex', () =>
    expect(() => {
      throw new Error('code 42');
    }).toThrow(/\d+/));
  eq(run().passed, 1);
});

test('one failing test does not stop the ones after it', () => {
  const ran = [];
  it('one', () => {
    ran.push('one');
    throw new Error('x');
  });
  it('two', () => ran.push('two'));
  it('three', () => {
    ran.push('three');
    throw new Error('y');
  });
  const report = run();
  eq(ran, ['one', 'two', 'three']);
  eq(report.passed, 1);
  eq(report.failed, 2);
});

test('a test that throws a non-Error is still reported', () => {
  it('rude', () => {
    throw 'just a string';
  });
  const report = run();
  eq(report.failed, 1);
  eq(report.failures[0].message, 'just a string');
});
