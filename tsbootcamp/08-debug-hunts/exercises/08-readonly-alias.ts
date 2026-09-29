// ─────────────────────────────────────────────────────────────────────────
//  08 · the function that reordered your list               ★★☆ core
//  concepts: in-place array methods · aliasing · readonly parameters
//  run: node ../run.js exercises/08-readonly-alias.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A leaderboard. `topScores` answers "who is winning" and `podium`
//  writes the one-line summary. Neither of them is allowed to disturb the
//  board it was handed — the board is stored in sign-up order elsewhere,
//  and other code depends on that order.
//
//      const board = [ada 12, bo 30, cy 21]   ← sign-up order
//      topScores(board, 2)   → [bo 30, cy 21]
//      board                 → still [ada 12, bo 30, cy 21]
//      podium(board)         → 'bo, cy, ada (first to sign up: ada)'
//
//  tsc is content. Two tests are not. Find the one call that is doing
//  more than it says, fix it minimally — and then change one type so the
//  compiler would have refused the original line.
//
//  hint: three array methods return a new array and three edit the one
//  you called them on. Write down which of the ones here is which before
//  you touch anything.

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

export function topScores(players: Player[], count: number): Player[] {
  return players.sort((a, b) => b.score - a.score).slice(0, count);
}

export function podium(players: Player[]): string {
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
