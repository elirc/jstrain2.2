// ─────────────────────────────────────────────────────────────────────────
//  24 · sequence and traverse                                  ★★☆ core
//  concepts: Result lists · all-or-first-error · short-circuit
//  run: node 24-sequence-and-traverse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 11 chained one Result at a time. Now you have twelve of
//  them — one per row of an imported CSV — and the question changes
//  shape: not "did this step work" but "did they ALL work, and if not,
//  which one stopped us".
//
//    sequenceResults(results) → one Result holding all the values
//        [succeed(1), succeed(2)]        → succeed([1, 2])
//        [succeed(1), fail(e), fail(e2)] → that first failure, as-is
//        []                              → succeed([])
//
//    traverseResults(items, fn) → map, then sequence, in one pass
//        fn(item, index) returns a Result
//        traverseResults(['1', '2'], parse) → succeed([1, 2])
//        it must STOP at the first failure — fn is not called again
//
//  hint: a plain `for` loop with an early `return result` is the whole
//  implementation. `.map()` cannot stop early, which is exactly the
//  behaviour traverse exists to avoid.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function sequenceResults(results) {
  throw new Error('TODO');
}

export function traverseResults(items, fn) {
  throw new Error('TODO');
}

// ── given: the two Result constructors from exercise 11 ──────────────────

export function succeed(value) {
  return { ok: true, value };
}

export function fail(error) {
  return {
    ok: false,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}

// '42' → succeed(42), '4x' → fail(...)
const parseInteger = (text) => {
  const n = Number(text);
  return Number.isInteger(n) ? succeed(n) : fail(`${text} is not an int`);
};

// ──────────────────────────── tests ──────────────────────────────────────

test('all successes become one success holding every value, in order', () => {
  eq(sequenceResults([succeed(1), succeed(2), succeed(3)]), {
    ok: true,
    value: [1, 2, 3],
  });
});

test('an empty list is a success holding an empty array', () => {
  eq(sequenceResults([]), { ok: true, value: [] });
});

test('the first failure is handed back untouched', () => {
  const failure = fail(new Error('row 2 is broken'));
  ok(sequenceResults([succeed(1), failure, succeed(3)]) === failure);
});

test('it keeps the FIRST failure, not the last', () => {
  const result = sequenceResults([
    fail('row 1 is broken'),
    fail('row 2 is broken'),
  ]);
  eq(result.error.message, 'row 1 is broken');
});

test('traverse maps each item and collects the values', () => {
  eq(traverseResults(['1', '2', '3'], parseInteger), {
    ok: true,
    value: [1, 2, 3],
  });
});

test('traverse reports the failure the mapper produced', () => {
  const result = traverseResults(['1', '4x', '3'], parseInteger);
  eq(result.ok, false);
  eq(result.error.message, '4x is not an int');
});

test('traverse stops calling fn at the first failure', () => {
  const fn = spy(parseInteger);
  traverseResults(['1', '4x', '3', '4'], fn);
  eq(fn.callCount, 2);
});

test('traverse hands fn the index as well as the item', () => {
  const result = traverseResults(['a', 'b'], (item, index) =>
    succeed(`${index}:${item}`)
  );
  eq(result.value, ['0:a', '1:b']);
});
