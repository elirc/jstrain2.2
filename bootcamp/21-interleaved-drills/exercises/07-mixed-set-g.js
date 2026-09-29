// ─────────────────────────────────────────────────────────────────────────
//  07 · mixed set G                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 07-mixed-set-g.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five jobs at a chess club. No hints. One sitting.
//
//    tournamentOptions({ rounds: 0, tieBreak: '', byePoints: null })
//      → { rounds: 0, rated: true, tieBreak: '', byePoints: 0.5 }
//      defaults: rounds 7 · rated true · tieBreak 'buchholz' ·
//                byePoints 0.5
//    standings(GAMES)  → { Ada: 2.5, Bo: 0, Cyd: 1.5 }
//      result 'white' → white scores 1 · 'black' → black scores 1 ·
//      'draw' → half a point each. Everyone who played appears.
//    rankPlayers(PLAYERS) → points ↓, then wins ↓, then name A→Z
//    pieceValue('rook') → 5
//      pawn 1 · knight 3 · bishop 3 · rook 5 · queen 9 · anything else 0
//    parseClock('90+30') → { baseMin: 90, incSec: 30 }
//    parseClock('5')     → { baseMin: 5, incSec: 0 }
//    parseClock('blitz') → null
//
//  PLAYERS is frozen.

import { test, eq } from '../../_lib/check.js';

const GAMES = [
  { white: 'Ada', black: 'Bo', result: 'white' },
  { white: 'Cyd', black: 'Ada', result: 'draw' },
  { white: 'Bo', black: 'Cyd', result: 'black' },
  { white: 'Ada', black: 'Cyd', result: 'white' },
];

const PLAYERS = Object.freeze([
  { name: 'Ada', points: 2.5, wins: 2 },
  { name: 'Bo', points: 1.5, wins: 1 },
  { name: 'Cyd', points: 1.5, wins: 1 },
  { name: 'Dre', points: 2.5, wins: 1 },
  { name: 'Eve', points: 0, wins: 0 },
]);

export function tournamentOptions(saved) {
  throw new Error('TODO');
}

export function standings(games) {
  throw new Error('TODO');
}

export function rankPlayers(players) {
  throw new Error('TODO');
}

export function pieceValue(piece) {
  throw new Error('TODO');
}

export function parseClock(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('zero rounds and an empty tie-break survive; null does not', () => {
  eq(tournamentOptions({ rounds: 0, tieBreak: '', byePoints: null }), {
    rounds: 0,
    rated: true,
    tieBreak: '',
    byePoints: 0.5,
  });
  eq(tournamentOptions({ rated: false }).rated, false);
});

test('anything the saved settings skip comes from the defaults', () => {
  const defaults = {
    rounds: 7,
    rated: true,
    tieBreak: 'buchholz',
    byePoints: 0.5,
  };
  eq(tournamentOptions({}), defaults);
  eq(tournamentOptions(), defaults);
});

test('points tally over the crosstable', () => {
  eq(standings(GAMES), { Ada: 2.5, Bo: 0, Cyd: 1.5 });
  eq(standings([]), {});
});

test('the table sorts by points, then wins, then name', () => {
  eq(rankPlayers(PLAYERS).map((p) => p.name), [
    'Ada',
    'Dre',
    'Bo',
    'Cyd',
    'Eve',
  ]);
});

test('ranking leaves the frozen roster alone', () => {
  rankPlayers(PLAYERS);
  eq(PLAYERS.map((p) => p.name), ['Ada', 'Bo', 'Cyd', 'Dre', 'Eve']);
});

test('the piece table answers 0 for names it does not own', () => {
  eq(pieceValue('pawn'), 1);
  eq(pieceValue('rook'), 5);
  eq(pieceValue('queen'), 9);
  eq(pieceValue('duck'), 0);
  eq(pieceValue('valueOf'), 0);
  eq(pieceValue('hasOwnProperty'), 0);
});

test('time controls parse in both forms, and refuse nonsense', () => {
  eq(parseClock('90+30'), { baseMin: 90, incSec: 30 });
  eq(parseClock('5'), { baseMin: 5, incSec: 0 });
  eq(parseClock('3+2'), { baseMin: 3, incSec: 2 });
  eq(parseClock('blitz'), null);
  eq(parseClock('90+'), null);
  eq(parseClock(''), null);
});
