// ─────────────────────────────────────────────────────────────────────────
//  06 · mixed set F — SOLUTION                             ★★☆ core
//  run: node 06-mixed-set-f.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — five tools, one per job:
//  1. A wrapper arrow keeps the call SITE intact: `(...args) =>
//     controller[name](...args)` is still a method call, so `this` is the
//     controller every time. `.bind` would do it too; the wrapper also
//     survives the method being swapped out later.
//  2. An id generator is a counter plus a template string, one `issued`
//     per call to the factory. Two generators, two closures, no sharing.
//  3. Spread one level per step of the path — object, routes, the route,
//     then a fresh array via `map` (or slice + assign on the COPY).
//     Everything off the path stays shared, which the `===` test checks.
//  4. `Object.keys` is own-only; `for…in` walks the chain. Inherited =
//     what `for…in` sees minus what `Object.hasOwn` claims. That one
//     difference is behind most "why is this key here?" bugs.
//  5. Set difference: put the served ports in a Set for O(1) lookups,
//     then filter the planned list while remembering what you already
//     emitted — that second Set is what dedupes.

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
  const handlers = {};
  for (const name of names) {
    handlers[name] = (...args) => controller[name](...args);
  }
  return handlers;
}

export function makeTicketIds(prefix) {
  let issued = 0;
  return () => `${prefix}-${(issued += 1)}`;
}

export function retimeSailing(timetable, routeId, index, time) {
  const route = timetable.routes[routeId];
  return {
    ...timetable,
    routes: {
      ...timetable.routes,
      [routeId]: {
        ...route,
        sailings: route.sailings.map((at, i) => (i === index ? time : at)),
      },
    },
  };
}

export function settingsReport(config) {
  const own = Object.keys(config).sort();
  const inherited = [];
  for (const key in config) {
    if (!Object.hasOwn(config, key)) inherited.push(key);
  }
  return { own, inherited: inherited.sort() };
}

export function newPortsOnly(planned, served) {
  const known = new Set(served);
  const emitted = new Set();
  return planned.filter((port) => {
    if (known.has(port) || emitted.has(port)) return false;
    emitted.add(port);
    return true;
  });
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
