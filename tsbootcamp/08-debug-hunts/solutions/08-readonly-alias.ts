// ─────────────────────────────────────────────────────────────────────────
//  08 · the function that reordered your list — SOLUTION    ★★☆ core
//  run: node ../run.js solutions/08-readonly-alias.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — an in-place array method reaching through an alias into
//  the caller's data.
//
//  THE TELL — the function returns the right answer and something ELSE
//  is wrong afterwards. `topScores` passes its own test; the board it was
//  given is what changed. When a correct-looking function breaks its
//  caller, look for a method that edits rather than copies.
//
//  `sort` is one of six that mutate — `sort`, `reverse`, `splice`,
//  `push`/`pop`, `shift`/`unshift`, `fill` — and it is the dangerous one
//  because it also RETURNS the array, so it chains exactly like `map`,
//  `filter` and `slice`, which do not mutate. `players.sort(...).slice()`
//  reads like a pipeline and is a write. (ES2023 added `toSorted` and
//  `toReversed`, the copying versions — available under `lib: es2023`.)
//
//  In `podium` the damage arrives from a distance: `players[0]` is read
//  AFTER `topScores` has reordered the very array it is reading from.
//  That is the flavour of bug aliasing produces — the wrong line looks
//  innocent and the guilty one is in another function.
//
//  WHY TSC COULD NOT CATCH IT — `Player[]` is a mutable array type, and
//  `sort` is a legal method on it. TypeScript models the SHAPE of a
//  value, never who else is holding a reference to it. Nothing in
//  `topScores(players: Player[])` says "I will not write to this", so
//  nothing can be violated.
//
//  THE FIX — copy first (`[...players].sort(...)`), and then say so in
//  the type: `readonly Player[]`. That annotation deletes `sort`, `push`
//  and friends from the parameter's API, so the original line becomes a
//  compile error, and it costs callers nothing — a `Player[]` is
//  assignable to a `readonly Player[]`. Take the widest honest input,
//  and let the signature carry the promise the body is making.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Player {
  name: string;
  score: number;
}

export function makeBoard(): Player[] {
  return [
    { name: 'ada', score: 12 },
    { name: 'bo', score: 30 },
    { name: 'cy', score: 21 },
    { name: 'di', score: 7 },
  ];
}

export function topScores(
  players: readonly Player[],
  count: number
): Player[] {
  return [...players].sort((a, b) => b.score - a.score).slice(0, count);
}

export function podium(players: readonly Player[]): string {
  const names = topScores(players, 3)
    .map((player) => player.name)
    .join(', ');
  return `${names} (first to sign up: ${players[0].name})`;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('the top two come back highest first', () => {
  eq(topScores(makeBoard(), 2), [
    { name: 'bo', score: 30 },
    { name: 'cy', score: 21 },
  ]);
});

test('a count past the end of the board returns everyone', () => {
  eq(topScores(makeBoard(), 99).length, 4);
  eq(topScores(makeBoard(), 0), []);
});

test('the board keeps the order it was passed in', () => {
  const board = makeBoard();
  topScores(board, 2);
  eq(
    board.map((player) => player.name),
    ['ada', 'bo', 'cy', 'di']
  );
});

test('asking twice gives the same answer', () => {
  const board = makeBoard();
  const first = topScores(board, 2);
  const second = topScores(board, 2);
  eq(first, second);
});

test('the podium names the first entrant, not the leader', () => {
  eq(podium(makeBoard()), 'bo, cy, ada (first to sign up: ada)');
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof topScores>, Player[]>>;
type _t2 = Expect<Equal<ReturnType<typeof podium>, string>>;

function _typeTests() {
  const top: Player[] = topScores(makeBoard(), 1);
  use(top);

  // @ts-expect-error — a count is a number
  topScores(makeBoard(), '1');

  // @ts-expect-error — a Player needs a score
  topScores([{ name: 'ada' }], 1);
}
use(_typeTests);
