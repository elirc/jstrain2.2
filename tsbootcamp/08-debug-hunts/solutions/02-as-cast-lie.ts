// ─────────────────────────────────────────────────────────────────────────
//  02 · the cast that lied — SOLUTION                      ★☆☆ warm-up
//  run: node ../run.js solutions/02-as-cast-lie.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — an `as` assertion standing in for a check.
//
//  THE TELL — the failures are not wrong ANSWERS, they are crashes:
//  `.join is not a function`, `.map is not a function`. A TypeError on a
//  line tsc approved always means the same thing: something upstream told
//  the compiler a shape that the value does not have.
//
//  `payload as Tagged[]` is that something. One line, four failures.
//
//  WHY TSC COULD NOT CATCH IT — an assertion is not a conversion and not
//  a check; it is the programmer overruling the compiler. `unknown as
//  Tagged[]` compiles for the same reason `2 + 2 as unknown as string`
//  does: you asked. And because the assertion is one expression, it
//  covers every field of every row at once — id, label, tags, and the
//  arrayness of the payload itself. That is a lot of promises for eleven
//  characters.
//
//  THE FIX — swap the claim for a proof. `Array.isArray` handles "is it
//  even a list", and `filter(isTagged)` does the per-row work; because
//  `isTagged` is a type predicate, the filtered array comes back typed
//  `Tagged[]` with no assertion at all. `map` below it never changes.
//
//  Note the one `as` that survives, inside the guard:
//  `value as Record<string, unknown>` after `typeof value === 'object'`.
//  That is the honest kind — it widens access to unknown keys AFTER a
//  check, and every field is still tested one by one underneath it. The
//  difference between the two casts is not syntax, it is whether
//  anything was verified before the claim was made.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Tagged {
  id: string;
  label: string;
  tags: string[];
}

function isTagged(value: unknown): value is Tagged {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.label === 'string' &&
    Array.isArray(row.tags) &&
    row.tags.every((tag) => typeof tag === 'string')
  );
}

export function summarize(payload: unknown): string[] {
  const rows = Array.isArray(payload) ? payload.filter(isTagged) : [];
  return rows.map((row) => `${row.label} [${row.tags.join(' ')}]`);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('every good row becomes one line', () => {
  eq(
    summarize([
      { id: 'a', label: 'Ada', tags: ['x', 'y'] },
      { id: 'b', label: 'Bo', tags: [] },
    ]),
    ['Ada [x y]', 'Bo []']
  );
});

test('an empty feed is an empty result', () => {
  eq(summarize([]), []);
});

test('a row with no tags is dropped, the good ones survive', () => {
  eq(
    summarize([
      { id: 'a', label: 'Ada', tags: ['x'] },
      { id: 'b', label: 'Bo' },
    ]),
    ['Ada [x]']
  );
});

test('a row whose tags came through as a string is dropped', () => {
  eq(summarize([{ id: 'a', label: 'Ada', tags: 'x,y' }]), []);
});

test('a row with a numeric label is dropped, not stringified', () => {
  eq(summarize([{ id: 'a', label: 7, tags: ['x'] }]), []);
});

test('a payload that is not a list is empty, never a crash', () => {
  eq(summarize({ rows: [] }), []);
  eq(summarize(null), []);
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof summarize>, string[]>>;

function _typeTests() {
  const lines: string[] = summarize([]);
  use(lines);

  const wire: unknown = JSON.parse('[]');

  // @ts-expect-error — unknown has no members until something proves it
  wire.length;

  // …and this compiles, with no proof at all. That is the shape of the
  // problem, not the bug itself.
  const rows = wire as Tagged[];
  use(rows.length);
}
use(_typeTests);
