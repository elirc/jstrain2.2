// ─────────────────────────────────────────────────────────────────────────
//  41 · normalize into byId + allIds — SOLUTION               ★★☆ core
//  run: node 41-normalize-entities.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape exists because the two questions an app asks have
//  different best answers — "give me entity X" wants a hash, "what order do
//  I render" wants an array. Keep them in sync and every read is O(1) while
//  the list order stays yours to control. `upsert` writes `byId` with a
//  spread (new object, old entries shared) and only touches `allIds` when
//  the id is genuinely new; forgetting that `includes` check is how the
//  same track ends up rendered twice after an edit. `removeById` uses rest
//  destructuring to build a byId without one key — `delete state.byId[id]`
//  would mutate the state you were handed. Returning the SAME state object
//  for a no-op delete is what lets `useSelector` skip the re-render.

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
  return {
    byId: Object.fromEntries(items.map((item) => [item[idKey], item])),
    allIds: items.map((item) => item[idKey]),
  };
}

export function upsert(state, entity, idKey = 'id') {
  const id = entity[idKey];
  return {
    byId: { ...state.byId, [id]: entity },
    allIds: state.allIds.includes(id) ? state.allIds : [...state.allIds, id],
  };
}

export function removeById(state, id) {
  if (!Object.hasOwn(state.byId, id)) return state;
  const { [id]: gone, ...rest } = state.byId;
  return { byId: rest, allIds: state.allIds.filter((known) => known !== id) };
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
