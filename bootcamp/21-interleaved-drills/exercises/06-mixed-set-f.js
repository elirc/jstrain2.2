// ─────────────────────────────────────────────────────────────────────────
//  06 · mixed set F                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 06-mixed-set-f.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five jobs around a ferry timetable. No hints. One sitting.
//
//    const h = toHandlers(controller, ['board', 'status']);
//    h.board(2) → 'Bergen: 2'      ← called bare, no receiver in sight
//    const next = makeTicketIds('F');   next() → 'F-1';  next() → 'F-2'
//    retimeSailing(TIMETABLE, 'north', 1, '11:00')
//      → a new timetable whose north sailings are
//        ['08:00', '11:00', '14:00']; TIMETABLE is deep-frozen
//    settingsReport(config)
//      → { own: ['lane', 'seat'], inherited: ['meals', 'wifi'] }
//        (both lists sorted; `config` is built on top of FERRY_DEFAULTS)
//    newPortsOnly(['Ålesund', 'Molde', 'Ålesund'], ['Molde'])
//      → ['Ålesund']

import { test, eq } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const TIMETABLE = deepFreeze({
  port: 'Bergen',
  routes: {
    north: { name: 'Northline', sailings: ['08:00', '10:30', '14:00'] },
    west: { name: 'Westline', sailings: ['09:15'] },
  },
});

const FERRY_DEFAULTS = { lane: 'A', wifi: false, meals: true };
const makeConfig = (own) => Object.assign(Object.create(FERRY_DEFAULTS), own);

const makeController = () => ({
  port: 'Bergen',
  boarded: 0,
  board(count) {
    this.boarded += count;
    return `${this.port}: ${this.boarded}`;
  },
  status() {
    return `${this.port} ok`;
  },
});

export function toHandlers(controller, names) {
  throw new Error('TODO');
}

export function makeTicketIds(prefix) {
  throw new Error('TODO');
}

export function retimeSailing(timetable, routeId, index, time) {
  throw new Error('TODO');
}

export function settingsReport(config) {
  throw new Error('TODO');
}

export function newPortsOnly(planned, served) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('handlers keep their controller when called bare', () => {
  const controller = makeController();
  const h = toHandlers(controller, ['board', 'status']);
  eq(Object.keys(h), ['board', 'status']);
  eq(h.status(), 'Bergen ok');
});

test('handlers pass their arguments through to the real method', () => {
  const controller = makeController();
  const h = toHandlers(controller, ['board']);
  eq(h.board(2), 'Bergen: 2');
  eq(h.board(3), 'Bergen: 5');
  eq(controller.boarded, 5);
});

test('two id generators never share a number', () => {
  const north = makeTicketIds('N');
  const west = makeTicketIds('W');
  eq([north(), north(), north()], ['N-1', 'N-2', 'N-3']);
  eq(west(), 'W-1');
  eq(north(), 'N-4');
});

test('retiming returns a new timetable with the new time', () => {
  const after = retimeSailing(TIMETABLE, 'north', 1, '11:00');
  eq(after.routes.north.sailings, ['08:00', '11:00', '14:00']);
  eq(after.routes.north.name, 'Northline');
  eq(after.port, 'Bergen');
});

test('the frozen timetable is untouched and quiet routes are shared', () => {
  const after = retimeSailing(TIMETABLE, 'north', 1, '11:00');
  eq(TIMETABLE.routes.north.sailings, ['08:00', '10:30', '14:00']);
  eq(after.routes.west === TIMETABLE.routes.west, true);
});

test('own settings and inherited defaults are told apart', () => {
  eq(settingsReport(makeConfig({ lane: 'C', seat: 12 })), {
    own: ['lane', 'seat'],
    inherited: ['meals', 'wifi'],
  });
  eq(settingsReport(makeConfig({})), {
    own: [],
    inherited: ['lane', 'meals', 'wifi'],
  });
});

test('planned ports minus served ports, deduped, order kept', () => {
  eq(
    newPortsOnly(['Ålesund', 'Molde', 'Ålesund', 'Florø'], ['Molde', 'Bodø']),
    ['Ålesund', 'Florø']
  );
  eq(newPortsOnly([], ['Molde']), []);
  eq(newPortsOnly(['Molde'], []), ['Molde']);
});
