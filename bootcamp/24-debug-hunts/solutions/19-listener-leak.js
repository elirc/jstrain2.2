// ─────────────────────────────────────────────────────────────────────────
//  19 · the ticker that would not stop — SOLUTION               ★★☆ core
//  concepts: bug hunt · listener identity · removeEventListener
//  run: node 19-listener-leak.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: listener leak by identity. off() removes by REFERENCE —
//  indexOf, ===. start() attached one arrow function; stop() built a
//  brand-new arrow with the same text and asked the feed to remove that.
//  Two arrows with identical source are still two different objects, so
//  off() found nothing and quietly removed nothing.
//  The tell: an inline arrow passed to BOTH on() and off(). The only way
//  off can ever work is if both sides hold the SAME reference — so the
//  handler must be created once and stored.
//  The minimal fix: build the handler in start(), keep it on the
//  instance, hand the same reference to off():
//      this.onPrice = (price) => this.record(price);
//  In the wild: removeEventListener with a re-bound method
//  (`this.onClick.bind(this)` creates a new function every call), React
//  effects tearing down a different closure than they attached, and
//  every "why does this fire twice after remount" issue ever filed.

import { test, eq, ok } from '../../_lib/check.js';

export class PriceTicker {
  constructor(feed) {
    this.feed = feed;
    this.prices = [];
  }
  record(price) {
    this.prices.push(price);
  }
  start() {
    this.onPrice = (price) => this.record(price);
    this.feed.on('price', this.onPrice);
  }
  stop() {
    this.feed.off('price', this.onPrice);
  }
}

// ── provided: a minimal emitter (audited — the bug is not in here) ───────
export function makeFeed() {
  const listeners = new Map();
  return {
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    off(type, fn) {
      const list = listeners.get(type) ?? [];
      const i = list.indexOf(fn);
      if (i !== -1) list.splice(i, 1);
    },
    emit(type, ...args) {
      for (const fn of [...(listeners.get(type) ?? [])]) fn(...args);
    },
    count(type) {
      return (listeners.get(type) ?? []).length;
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('records prices while started', () => {
  const feed = makeFeed();
  const ticker = new PriceTicker(feed);
  ticker.start();
  feed.emit('price', 10);
  feed.emit('price', 11);
  eq(ticker.prices, [10, 11]);
});

test('after stop() nothing more is recorded', () => {
  const feed = makeFeed();
  const ticker = new PriceTicker(feed);
  ticker.start();
  feed.emit('price', 10);
  ticker.stop();
  feed.emit('price', 99);
  eq(ticker.prices, [10]);
});

test('stop() actually detaches from the feed', () => {
  const feed = makeFeed();
  const ticker = new PriceTicker(feed);
  ticker.start();
  eq(feed.count('price'), 1);
  ticker.stop();
  eq(feed.count('price'), 0);
});

test('start/stop/start does not double-count', () => {
  const feed = makeFeed();
  const ticker = new PriceTicker(feed);
  ticker.start();
  ticker.stop();
  ticker.start();
  feed.emit('price', 42);
  eq(ticker.prices, [42]);
  eq(feed.count('price'), 1);
});

test('stopping one ticker leaves other consumers attached', () => {
  const feed = makeFeed();
  const ticker = new PriceTicker(feed);
  const seen = [];
  feed.on('price', (p) => seen.push(p));
  ticker.start();
  ticker.stop();
  feed.emit('price', 7);
  eq(seen, [7]);
  ok(feed.count('price') >= 1, 'the other consumer must survive');
});
