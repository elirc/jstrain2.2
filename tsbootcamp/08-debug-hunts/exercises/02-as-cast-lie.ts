// ─────────────────────────────────────────────────────────────────────────
//  02 · the cast that lied                                 ★☆☆ warm-up
//  concepts: as-assertions · unvalidated payloads · trust boundaries
//  run: node ../run.js exercises/02-as-cast-lie.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A feed we do not own hands us an already-parsed payload. `summarize`
//  turns the rows that really are `Tagged` into one line each, and quietly
//  drops everything else. Nothing about a bad feed should throw.
//
//      summarize([{ id: 'a', label: 'Ada', tags: ['x', 'y'] }])
//                                            → ['Ada [x y]']
//      summarize([{ id: 'b', label: 'Bo' }]) → []      (no tags)
//      summarize([{ id: 'c', label: 7, tags: [] }])
//                                            → []      (label is a number)
//      summarize({ rows: [] })               → []      (not a list at all)
//      summarize([])                         → []
//
//  tsc says this file is fine. Four tests say otherwise. Find the one
//  line that made a promise the data never kept, fix it minimally, and do
//  not rewrite the file.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Tagged {
  id: string;
  label: string;
  tags: string[];
}

export function summarize(payload: unknown): string[] {
  const rows = payload as Tagged[];
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
