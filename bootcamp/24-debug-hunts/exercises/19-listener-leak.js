// ─────────────────────────────────────────────────────────────────────────
//  19 · the ticker that would not stop                          ★★☆ core
//  concepts: bug hunt · listener identity · removeEventListener
//  run: node 19-listener-leak.js
// ─────────────────────────────────────────────────────────────────────────
//
//  PriceTicker follows a price feed. start() subscribes, stop() must
//  fully unsubscribe — after stop() the ticker records nothing and the
//  feed holds zero of its listeners:
//
//      ticker.start(); feed.emit('price', 10)  → recorded
//      ticker.stop();  feed.emit('price', 11)  → ignored, feed is clean
//
//  In production the widget is started and stopped as it scrolls in and
//  out of view — and after a while every price update is counted several
//  times, and the process holds thousands of dead listeners.
//
//  The code below is fully written — and wrong. 3 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: `feed.count('price')` tells you how many listeners are attached.
//  Print it after start() and again after stop(). Then ask: what EXACTLY
//  does off() compare, and does anything here compare equal?

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
    this.feed.on('price', (price) => this.record(price));
  }
  stop() {
    this.feed.off('price', (price) => this.record(price));
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
