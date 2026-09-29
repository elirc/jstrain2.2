// ─────────────────────────────────────────────────────────────────────────
//  07 · circular buffer                                    ★★★ stretch
//  concepts: modular arithmetic · fixed memory · ring indexing
//  run: node 07-circular-buffer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Keep the last N" with a hard memory ceiling: crash log tails, audio
//  sample rings, metrics windows. The array is allocated ONCE at the given
//  capacity and never grows — when it is full, the newest write lands on
//  the oldest value and the start marker steps forward.
//
//      const buf = new CircularBuffer(3);
//      buf.push('a'); buf.push('b'); buf.push('c');
//      buf.toArray()  → ['a', 'b', 'c']     oldest → newest
//      buf.isFull()   → true
//      buf.push('d');
//      buf.toArray()  → ['b', 'c', 'd']     'a' was overwritten
//      buf.size()     → 3                    never more than capacity
//
//  You get `this.slots` (fixed length), `this.start` (index of the oldest
//  item) and `this.count` (slots in use). Never push/splice `slots`.
//
//  hint: the next write goes to (start + count) % capacity — and when the
//  buffer is already full, start has to move too

import { test, eq } from '../../_lib/check.js';

export class CircularBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.slots = new Array(capacity);
    this.start = 0; // index of the oldest item
    this.count = 0; // how many slots are in use
  }

  push(value) {
    throw new Error('TODO');
  }

  toArray() {
    throw new Error('TODO');
  }

  size() {
    throw new Error('TODO');
  }

  isFull() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('keeps items in insertion order while there is room', () => {
  const buf = new CircularBuffer(3);
  buf.push('a');
  buf.push('b');
  eq(buf.toArray(), ['a', 'b']);
  eq(buf.size(), 2);
});

test('isFull flips exactly at capacity', () => {
  const buf = new CircularBuffer(2);
  buf.push(1);
  eq(buf.isFull(), false);
  buf.push(2);
  eq(buf.isFull(), true);
});

test('overwrites the oldest item once it is full', () => {
  const buf = new CircularBuffer(3);
  for (const ch of ['a', 'b', 'c', 'd']) buf.push(ch);
  eq(buf.toArray(), ['b', 'c', 'd']);
  eq(buf.size(), 3);
});

test('keeps wrapping cleanly past a full lap', () => {
  const buf = new CircularBuffer(3);
  for (let n = 1; n <= 7; n += 1) buf.push(n);
  eq(buf.toArray(), [5, 6, 7]);
});

test('a capacity of 1 keeps only the newest value', () => {
  const buf = new CircularBuffer(1);
  buf.push('old');
  buf.push('new');
  eq(buf.toArray(), ['new']);
  eq(buf.size(), 1);
});

test('an empty buffer reports empty', () => {
  const buf = new CircularBuffer(4);
  eq(buf.toArray(), []);
  eq(buf.size(), 0);
});

test('the backing array never grows past the capacity', () => {
  const buf = new CircularBuffer(3);
  for (let n = 0; n < 50; n += 1) buf.push(n);
  eq(buf.slots.length, 3);
  eq(buf.toArray(), [47, 48, 49]);
});

test('application: keeps the last 5 lines of a noisy log', () => {
  const tail = new CircularBuffer(5);
  for (let n = 1; n <= 12; n += 1) tail.push(`line-${n}`);
  eq(tail.toArray(), [
    'line-8',
    'line-9',
    'line-10',
    'line-11',
    'line-12',
  ]);
});
