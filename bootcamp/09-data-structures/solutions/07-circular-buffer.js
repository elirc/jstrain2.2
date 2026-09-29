// ─────────────────────────────────────────────────────────────────────────
//  07 · circular buffer — SOLUTION                         ★★★ stretch
//  run: node 07-circular-buffer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the ring is an illusion produced by `% capacity`. Two
//  numbers describe the whole state — `start` (where the oldest value
//  lives) and `count` (how many are live) — so the write index is always
//  (start + count) % capacity. When the buffer is full, count stays put and
//  start advances instead: that single line is what turns "append" into
//  "overwrite the oldest".
//  push and size are O(1) with zero allocation; toArray is O(n) and is the
//  only place the ring gets straightened out. Compare with the array
//  version, `arr.push(v); if (arr.length > n) arr.shift();` — correct, but
//  every push over the limit reindexes the whole array and the array keeps
//  reallocating. Fixed-size ring buffers are what you want in a hot loop.
//  Classic wrong turn: forgetting to advance `start` when full, which
//  scrambles the order after the first wrap.

import { test, eq } from '../../_lib/check.js';

export class CircularBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.slots = new Array(capacity);
    this.start = 0; // index of the oldest item
    this.count = 0; // how many slots are in use
  }

  push(value) {
    this.slots[(this.start + this.count) % this.capacity] = value;
    if (this.count < this.capacity) {
      this.count += 1;
    } else {
      this.start = (this.start + 1) % this.capacity;
    }
    return this;
  }

  toArray() {
    const out = [];
    for (let i = 0; i < this.count; i += 1) {
      out.push(this.slots[(this.start + i) % this.capacity]);
    }
    return out;
  }

  size() {
    return this.count;
  }

  isFull() {
    return this.count === this.capacity;
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
