// ─────────────────────────────────────────────────────────────────────────
//  37 · toSpliced, with and toReversed                     ★★☆ core
//  concepts: the copying array methods · negative indexes
//  run: node 37-tospliced-and-with.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A play queue lives in state, so every edit has to hand back a NEW array.
//  Since Node 20 you no longer have to spell that out with slices — `with`
//  replaces one slot, `toSpliced` inserts and removes, `toReversed` flips.
//
//      replaceTrack(QUEUE, 1, HALO)   → q1, HALO, q3
//      insertAfter(QUEUE, 0, HALO)    → q1, HALO, q2, q3
//      removeTrack(QUEUE, 'q2')       → q1, q3
//      reversedQueue(QUEUE)           → q3, q2, q1
//
//  `removeTrack` with an id that is not queued has nothing to do — hand
//  back the very same array so React can skip the re-render.
//
//  hint: `with` accepts a negative index and throws `RangeError` when the
//  index is outside the array — it never silently grows it.

import { test, eq, ok, throws } from '../../_lib/check.js';

const QUEUE = Object.freeze([
  Object.freeze({ id: 'q1', title: 'Nightdrive' }),
  Object.freeze({ id: 'q2', title: 'Slow Tide' }),
  Object.freeze({ id: 'q3', title: 'Ember' }),
]);

const HALO = Object.freeze({ id: 'qh', title: 'Halo' });
const ids = (queue) => queue.map((t) => t.id);

export function replaceTrack(queue, index, track) {
  throw new Error('TODO');
}

export function insertAfter(queue, index, track) {
  throw new Error('TODO');
}

export function removeTrack(queue, id) {
  throw new Error('TODO');
}

export function reversedQueue(queue) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('replaceTrack swaps one slot into a fresh array', () => {
  const next = replaceTrack(QUEUE, 1, HALO);
  eq(ids(next), ['q1', 'qh', 'q3']);
  ok(next !== QUEUE);
  ok(next[0] === QUEUE[0]);
});

test('replaceTrack accepts a negative index', () => {
  eq(ids(replaceTrack(QUEUE, -1, HALO)), ['q1', 'q2', 'qh']);
});

test('an index past the end is a RangeError, not a silent append', () => {
  throws(() => replaceTrack(QUEUE, 9, HALO));
});

test('insertAfter drops the track into the next slot', () => {
  eq(ids(insertAfter(QUEUE, 0, HALO)), ['q1', 'qh', 'q2', 'q3']);
});

test('insertAfter the last track appends', () => {
  eq(ids(insertAfter(QUEUE, 2, HALO)), ['q1', 'q2', 'q3', 'qh']);
});

test('removeTrack drops the track with that id', () => {
  eq(ids(removeTrack(QUEUE, 'q2')), ['q1', 'q3']);
});

test('removing something that is not queued changes nothing at all', () => {
  ok(removeTrack(QUEUE, 'nope') === QUEUE);
});

test('reversedQueue flips a copy and the frozen queue survives', () => {
  eq(ids(reversedQueue(QUEUE)), ['q3', 'q2', 'q1']);
  eq(ids(QUEUE), ['q1', 'q2', 'q3']);
});
