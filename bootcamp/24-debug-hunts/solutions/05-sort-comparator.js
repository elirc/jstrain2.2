// ─────────────────────────────────────────────────────────────────────────
//  05 · leaderboard — SOLUTION                                  ★★☆ core
//  run: node 05-sort-comparator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the comparator contract. sort() wants a NUMBER whose
//  SIGN answers "does a belong before b" — negative, zero, positive.
//
//  The tell: two returns in one comparator that do not have the same
//  type. `a.name < b.name ? -1 : 1` is a proper comparator; the line
//  above it, `return b.score > a.score`, hands back a boolean. Booleans
//  coerce to 1 and 0 — never negative — so the comparator can say "a goes
//  after b" and "they are equal" but has no way to say "a goes first".
//  Nothing ever moves left, and the board comes back in input order.
//
//  The fix: `return b.score - a.score;` — subtraction, high score first.
//
//  In the wild the same contract gets broken by `arr.sort()` with no
//  comparator at all, which stringifies: [1, 10, 2, 20]. Both bugs pass
//  every test written against an already-sorted fixture.

import { test, eq, ok } from '../../_lib/check.js';

const PLAYERS = [
  { name: 'ada', score: 42, games: 6 },
  { name: 'bo', score: 91, games: 7 },
  { name: 'cy', score: 91, games: 10 },
  { name: 'dee', score: 8, games: 2 },
  { name: 'eve', score: 60, games: 5 },
  { name: 'fin', score: 77, games: 0 },
];

const round2 = (n) => Math.round(n * 100) / 100;

export function leaderboard(players) {
  return players
    .filter((player) => player.games > 0)
    .map((player) => ({
      name: player.name,
      score: player.score,
      avg: round2(player.score / player.games),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.name < b.name ? -1 : 1;
    })
    .map((row, i) => ({ rank: i + 1, ...row }));
}

export function topN(players, n) {
  return leaderboard(players)
    .slice(0, n)
    .map((row) => row.name);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('players who have not played are left off the board', () => {
  const names = leaderboard(PLAYERS).map((row) => row.name);
  eq(names.includes('fin'), false);
  eq(names.length, 5);
});

test('rank 1 is the highest score on the board', () => {
  const top = leaderboard(PLAYERS)[0];
  eq(top.name, 'bo');
  eq(top.score, 91);
});

test('the whole board runs from highest score to lowest', () => {
  eq(leaderboard(PLAYERS).map((row) => row.name), [
    'bo',
    'cy',
    'eve',
    'ada',
    'dee',
  ]);
});

test('a tie is broken by name, A to Z', () => {
  const tied = [
    { name: 'cy', score: 91, games: 10 },
    { name: 'bo', score: 91, games: 7 },
  ];
  eq(leaderboard(tied).map((row) => row.name), ['bo', 'cy']);
});

test('ranks are 1-based and follow the board order', () => {
  eq(leaderboard(PLAYERS).map((row) => row.rank), [1, 2, 3, 4, 5]);
});

test('avg is score per game, rounded to two decimals', () => {
  const byName = new Map(leaderboard(PLAYERS).map((r) => [r.name, r.avg]));
  eq(byName.get('ada'), 7);
  eq(byName.get('cy'), 9.1);
  eq(byName.get('bo'), 13);
});

test('topN takes the best n names', () => {
  eq(topN(PLAYERS, 3), ['bo', 'cy', 'eve']);
  eq(topN(PLAYERS, 1), ['bo']);
});

test('an empty roster produces an empty board', () => {
  eq(leaderboard([]), []);
  eq(topN([], 3), []);
  ok(Array.isArray(leaderboard(PLAYERS)));
});
