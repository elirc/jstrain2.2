// ─────────────────────────────────────────────────────────────────────────
//  07 · test framework                                      ★★★ capstone
//  concepts: trees · recursion · module state · error handling
//  time: 35–45 min · 4 stages · 23 tests
//  run: node 07-test-framework.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  Build vitest. Not a toy version of vitest — the actual shape of it:
//  describe/it collect a tree while the file is being imported, then a
//  runner walks that tree and catches what each test throws. This file is
//  gloriously recursive: the bootcamp's own harness (check.js, three
//  metres to your left) is running the tests that test YOUR test runner.
//
//  STAGES — do them in order, run the file after each one
//    1. it + run ........... collect tests, run them, count the damage
//    2. expect ............. toBe, toEqual, and a deepEqual of your own
//    3. describe ........... nesting, and the path a failure reports
//    4. toThrow + safety ... assert on throwing code; survive rude tests
//
//  THE SPEC
//
//      describe('math', () => {
//        it('adds', () => expect(1 + 1).toBe(2));
//        it('breaks', () => expect(1).toBe(2));
//      });
//      run()
//        → { passed: 1, failed: 1,
//            failures: [{ path: 'math > breaks',
//                         message: 'expected 2 but got 1' }] }
//
//    run() PRINTS NOTHING — it returns a report. A runner that only prints
//    cannot be used by a watch mode, a CI reporter, or these tests.
//
//    run() also CLEARS what was collected, so the next run starts empty.
//    Order: a suite's own tests first, then its nested suites, each in
//    registration order.
//
//      expect(x).toBe(y)      Object.is — NaN equals NaN, 0 does not
//                             equal -0, and two identical-looking objects
//                             are NOT equal
//      expect(x).toEqual(y)   your deepEqual: arrays and plain objects,
//                             compared element by element and key by key
//      expect(fn).toThrow()          fn must throw
//      expect(fn).toThrow('boom')    ...with a message containing 'boom'
//      expect(fn).toThrow(/bo+m/)    ...or matching a RegExp
//
//    Failure messages, exactly:
//      toBe / toEqual  → `expected ${format(e)} but got ${format(a)}`
//      toThrow, quiet  → 'expected the function to throw'
//      toThrow, wrong  → `expected the error to match ${m}, got: ${msg}`
//
//    A test that throws something that is not an Error still has to be
//    reported — use String(thrown) as the message.
//
//  hint (stage 3): describe() must run its callback IMMEDIATELY, with a
//  module-level "current suite" pointer swapped to the new node and put
//  back in a finally. That is how nesting works with no arguments passed.

import { test, eq } from '../../_lib/check.js';

// provided — how values are shown inside failure messages.
const format = (value) => JSON.stringify(value) ?? String(value);

// stage 3 — collect a named group; the callback runs right away.
export function describe(name, fn) {
  throw new Error('TODO');
}

// stage 1 — register one test in whatever group is current.
export function it(name, fn) {
  throw new Error('TODO');
}

// stage 2 — deep equality for primitives, arrays and plain objects.
export function deepEqual(a, b) {
  throw new Error('TODO');
}

// stages 2 + 4 — the assertion API.
export function expect(actual) {
  throw new Error('TODO');
}

// stage 1 — run everything collected, return the report, collect nothing.
export function run() {
  throw new Error('TODO');
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
