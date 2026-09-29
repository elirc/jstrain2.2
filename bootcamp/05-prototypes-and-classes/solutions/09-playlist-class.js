// ─────────────────────────────────────────────────────────────────────────
//  09 · Playlist class — SOLUTION                          ★★☆ core
//  run: node 09-playlist-class.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: read the class as prototype code. `add`, `remove`, `has`
//  and `toArray` become properties of Playlist.prototype (non-enumerable,
//  which is why Object.keys(p) never lists them). `get size` becomes an
//  accessor descriptor on that same prototype object. `tracks = []` is
//  different: class fields run per instance, at construction time, so
//  every playlist gets a fresh array — the last two tests prove both
//  halves of that split.
//
//  The invariant lives in add(), which asks has(). One rule in one place.
//  toArray() returns `[...this.tracks]`: leaking the live array would let
//  a caller push a duplicate straight past the check.

import { test, eq, ok } from '../../_lib/check.js';

export class Playlist {
  tracks = [];

  constructor(name) {
    this.name = name;
  }

  add(title) {
    if (!this.has(title)) this.tracks.push(title);
    return this;
  }

  remove(title) {
    const at = this.tracks.indexOf(title);
    if (at === -1) return false;
    this.tracks.splice(at, 1);
    return true;
  }

  has(title) {
    return this.tracks.includes(title);
  }

  get size() {
    return this.tracks.length;
  }

  toArray() {
    return [...this.tracks];
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
