// ─────────────────────────────────────────────────────────────────────────
//  07 · mixed set G — SOLUTION                             ★★☆ core
//  run: node 07-mixed-set-g.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — five tools, one per job:
//  1. `??` again, in a new costume: `rounds: 0` and `tieBreak: ''` are
//     real answers a director typed, and `||` would silently overrule
//     both. `null` DOES fall back, because `??` treats `null` and
//     `undefined` as "no answer given".
//  2. A reduce whose accumulator is a score sheet. Seed both players to 0
//     before adding, so someone who lost every game still shows up — a
//     tally that only touches winners quietly drops the last-placed.
//  3. Three sort keys, chained with `||`: the next comparison is only
//     reached when the previous one returned 0. Copy first — `PLAYERS` is
//     frozen, so an in-place `.sort()` throws in strict mode (and every
//     ES module is strict).
//  4. `Object.hasOwn(TABLE, piece)` before reading, or the lookup answers
//     with `Object.prototype.valueOf` — a function, which is very much
//     not 0. A `Map`, or `Object.create(null)`, removes the trap at the
//     source.
//  5. Anchor the regex (`^…$`) or `'90+30x'` sneaks through, and convert
//     the captures with `Number` — a regex hands you strings.

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

const TOURNAMENT_DEFAULTS = {
  rounds: 7,
  rated: true,
  tieBreak: 'buchholz',
  byePoints: 0.5,
};

export function tournamentOptions(saved) {
  const options = {};
  for (const key of Object.keys(TOURNAMENT_DEFAULTS)) {
    options[key] = saved?.[key] ?? TOURNAMENT_DEFAULTS[key];
  }
  return options;
}

export function standings(games) {
  return games.reduce((table, game) => {
    table[game.white] ??= 0;
    table[game.black] ??= 0;
    if (game.result === 'white') table[game.white] += 1;
    else if (game.result === 'black') table[game.black] += 1;
    else {
      table[game.white] += 0.5;
      table[game.black] += 0.5;
    }
    return table;
  }, {});
}

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function rankPlayers(players) {
  return [...players].sort(
    (a, b) =>
      b.points - a.points || b.wins - a.wins || byText(a.name, b.name)
  );
}

const PIECE_VALUES = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };

export function pieceValue(piece) {
  return Object.hasOwn(PIECE_VALUES, piece) ? PIECE_VALUES[piece] : 0;
}

export function parseClock(text) {
  const match = /^(\d+)(?:\+(\d+))?$/.exec(text);
  if (!match) return null;
  return { baseMin: Number(match[1]), incSec: Number(match[2] ?? 0) };
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
