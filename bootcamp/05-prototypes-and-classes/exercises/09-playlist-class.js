// ─────────────────────────────────────────────────────────────────────────
//  09 · Playlist class                                     ★★☆ core
//  concepts: class · fields · methods · invariants
//  run: node 09-playlist-class.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Now the same machinery with `class` syntax. Build a Playlist that
//  protects one invariant: a track never appears twice.
//
//      const p = new Playlist('Road trip');
//      p.add('Roam').add('Roam').add('Debaser');
//      p.size            → 2        (a getter, not a method)
//      p.toArray()       → ['Roam', 'Debaser']
//      p.remove('Roam')  → true     (false if it was not there)
//      p.has('Roam')     → false
//
//  `tracks` must be a class FIELD initialised to an empty array, so each
//  playlist gets its own. add() returns `this` so calls chain, and
//  toArray() must hand back a COPY — callers should not be able to reach
//  in and break the invariant.
//
//  hint: write the duplicate check with has(), not with a second
//  includes() — one rule, one place

import { test, eq, ok } from '../../_lib/check.js';

export class Playlist {
  constructor(name) {
    throw new Error('TODO');
  }

  add(title) {
    throw new Error('TODO');
  }

  remove(title) {
    throw new Error('TODO');
  }

  has(title) {
    throw new Error('TODO');
  }

  get size() {
    throw new Error('TODO');
  }

  toArray() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a new playlist knows its name and is empty', () => {
  const p = new Playlist('Road trip');
  eq(p.name, 'Road trip');
  eq(p.size, 0);
  ok(p instanceof Playlist);
});

test('add appends tracks in order and chains', () => {
  const p = new Playlist('Mix');
  p.add('Roam').add('Debaser');
  eq(p.toArray(), ['Roam', 'Debaser']);
  eq(p.size, 2);
});

test('adding a duplicate changes nothing', () => {
  const p = new Playlist('Mix');
  p.add('Roam').add('Roam');
  eq(p.toArray(), ['Roam']);
  eq(p.has('Roam'), true);
  eq(p.has('Nope'), false);
});

test('remove reports whether it actually removed something', () => {
  const p = new Playlist('Mix');
  p.add('Roam').add('Debaser');
  eq(p.remove('Roam'), true);
  eq(p.remove('Roam'), false);
  eq(p.toArray(), ['Debaser']);
});

test('toArray hands back a copy, not the live array', () => {
  const p = new Playlist('Mix');
  p.add('Roam');
  const snapshot = p.toArray();
  snapshot.push('Sneaky');
  eq(p.size, 1);
});

test('every playlist gets its own tracks array', () => {
  const a = new Playlist('A');
  const b = new Playlist('B');
  a.add('Roam');
  eq(b.size, 0);
});

test('the methods live on the prototype, the fields on the instance', () => {
  const p = new Playlist('Mix');
  eq(Object.hasOwn(p, 'add'), false);
  eq(Object.keys(p).sort(), ['name', 'tracks']);
  ok(Object.getPrototypeOf(p) === Playlist.prototype);
});
