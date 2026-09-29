// ─────────────────────────────────────────────────────────────────────────
//  41 · normalize into byId + allIds                          ★★☆ core
//  concepts: entity stores · O(1) lookup · immutable updates
//  run: node 41-normalize-entities.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An array of entities makes you scan for every read and rebuild for every
//  write. Redux, RTK Query and every cache you have used store them the
//  other way round: a lookup table plus an order.
//
//      normalize(TRACKS)
//        → { byId: { t1: {…}, t2: {…}, t3: {…} }, allIds: ['t1','t2','t3'] }
//      upsert(STATE, { id: 't9', title: 'Halo', mins: 3 })
//        → new state, 't9' appended to allIds
//      removeById(STATE, 't1')
//        → new state, gone from both halves
//
//  Every writer returns a NEW state; an id that changes nothing hands the
//  old state straight back. upsert of a known id replaces it in place —
//  allIds keeps its order. byId holds the entities THEMSELVES, not copies,
//  and `idKey` picks the field to key on: `normalize(rows, 'code')`.
//
//  hint: `Object.fromEntries` builds byId in one line. For the delete,
//  rest destructuring — `const { [id]: gone, ...rest } = state.byId`.

import { test, eq, ok } from '../../_lib/check.js';

const TRACKS = Object.freeze([
  Object.freeze({ id: 't1', title: 'Nightdrive', mins: 4 }),
  Object.freeze({ id: 't2', title: 'Slow Tide',  mins: 6 }),
  Object.freeze({ id: 't3', title: 'Ember',      mins: 3 }),
]);

const ROWS = Object.freeze([
  Object.freeze({ code: 'A', label: 'Alpha' }),
  Object.freeze({ code: 'B', label: 'Beta' }),
]);

const STATE = Object.freeze({
  byId: Object.freeze({
    t1: Object.freeze({ id: 't1', title: 'Nightdrive', mins: 4 }),
    t2: Object.freeze({ id: 't2', title: 'Slow Tide',  mins: 6 }),
  }),
  allIds: Object.freeze(['t1', 't2']),
});

export function normalize(items, idKey = 'id') {
  throw new Error('TODO');
}

export function upsert(state, entity, idKey = 'id') {
  throw new Error('TODO');
}

export function removeById(state, id) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('normalize builds a lookup table and an order', () => {
  const state = normalize(TRACKS);
  eq(state.allIds, ['t1', 't2', 't3']);
  eq(state.byId.t2.title, 'Slow Tide');
});

test('byId holds the entities themselves, not copies', () => {
  ok(normalize(TRACKS).byId.t1 === TRACKS[0]);
});

test('the id field is configurable', () => {
  const state = normalize(ROWS, 'code');
  eq(state.allIds, ['A', 'B']);
  eq(state.byId.B.label, 'Beta');
});

test('upsert appends an id it has never seen', () => {
  const next = upsert(STATE, { id: 't9', title: 'Halo', mins: 3 });
  eq(next.allIds, ['t1', 't2', 't9']);
  eq(next.byId.t9.title, 'Halo');
});

test('upsert of a known id replaces in place, without reordering', () => {
  const next = upsert(STATE, { id: 't1', title: 'Nightdrive (remix)', mins: 5 });
  eq(next.allIds, ['t1', 't2']);
  eq(next.byId.t1.title, 'Nightdrive (remix)');
});

test('upsert leaves the previous state untouched', () => {
  const next = upsert(STATE, { id: 't1', title: 'Nightdrive (remix)', mins: 5 });
  eq(STATE.byId.t1.title, 'Nightdrive');
  ok(next !== STATE);
  ok(next.byId !== STATE.byId);
});

test('removeById drops the entity from both halves', () => {
  const next = removeById(STATE, 't1');
  eq(next.allIds, ['t2']);
  eq(Object.keys(next.byId), ['t2']);
  eq(STATE.allIds, ['t1', 't2']);
});

test('removing an id that is not there changes nothing at all', () => {
  ok(removeById(STATE, 'nope') === STATE);
});
