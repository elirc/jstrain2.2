// ─────────────────────────────────────────────────────────────────────────
//  05 · leaderboard                                             ★★☆ core
//  concepts: Array#sort · the comparator contract · stable ties
//  run: node 05-sort-comparator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  leaderboard(players) ranks everyone who has actually played:
//    · players with games === 0 are left off entirely
//    · highest score first; a tie is broken by name, A→Z
//    · each row is { rank, name, score, avg }, rank starting at 1
//    · avg is score / games, rounded to two decimals
//  topN(players, n) is the first n names off that board.
//
//      leaderboard([bo 91, ada 42, cy 91]) → bo, cy, ada
//
//  The code below is fully written — and wrong: 3 tests fail. Find the
//  planted bug and fix it with the smallest change that turns everything
//  green. It is one of the classic bug families; WHERE is the exercise.
//
//  hint: print the array immediately before and immediately after the
//  sort step. If it did not move, the sort was never told anything it
//  could act on — and then the question is what it WAS told.

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
      if (a.score !== b.score) return b.score > a.score;
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
