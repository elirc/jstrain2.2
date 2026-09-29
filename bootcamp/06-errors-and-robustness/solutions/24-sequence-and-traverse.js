// ─────────────────────────────────────────────────────────────────────────
//  24 · sequence and traverse — SOLUTION                       ★★☆ core
//  run: node 24-sequence-and-traverse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: sequence turns a list of Results inside out — a list of
//  Results becomes a Result of a list. The loop returns the failing
//  Result object ITSELF rather than rebuilding it, so nothing about the
//  error is lost or copied, and the caller can compare identity.
//  traverse is map and sequence fused, and the fusion is the point: it
//  stops calling fn the moment one item fails. `items.map(fn)` followed
//  by sequence gives the same answer, but only after running the mapper
//  over every remaining row — which matters when the mapper hits a
//  database, or when row 2 failing means rows 3-4000 are meaningless.
//  Classic wrong turn: `results.map((r) => r.value)`. Every failure
//  silently contributes `undefined`, the array looks the right length,
//  and the import writes half a file of blanks.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function sequenceResults(results) {
  const values = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return succeed(values);
}

export function traverseResults(items, fn) {
  const values = [];
  for (let index = 0; index < items.length; index += 1) {
    const result = fn(items[index], index);
    if (!result.ok) return result;
    values.push(result.value);
  }
  return succeed(values);
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
