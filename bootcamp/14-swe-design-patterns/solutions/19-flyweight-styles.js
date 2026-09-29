// ─────────────────────────────────────────────────────────────────────────
//  19 · flyweight styles — SOLUTION                           ★☆☆ warm-up
//  concepts: flyweight · interning · object identity
//  run: node solutions/19-flyweight-styles.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — when many objects need the same immutable value, hand them
//  all one shared copy instead of one copy each.
//  The pattern is a cache keyed by a *canonical* description of the
//  value. Canonical is the whole trick: `{a,b}` and `{b,a}` are the same
//  style, so the key has to sort the entries — `JSON.stringify(spec)`
//  looks right and quietly gives you two entries for one style.
//  Freezing is not decoration. A shared object with a mutable field is
//  spooky action at a distance: one cell writes `style.color` and 300
//  cells change colour.
//  Split the state before you cache: intrinsic (shared, in the
//  flyweight) vs extrinsic (per-owner, stays outside). Text and position
//  are extrinsic here, which is why the flyweight can be shared at all.
//  When NOT to use: cheap or few objects — the Map is memory too, and
//  the indirection buys nothing. Never intern anything that mutates.
//  In the wild: `Symbol.for()` is literally a flyweight registry, Java's
//  `Integer.valueOf` cache, JS string interning, glyph/tile atlases in
//  game engines, React's frozen default props objects.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createStyleFactory() {
  const cache = new Map();

  const keyOf = (spec) =>
    Object.keys(spec)
      .sort()
      .map((key) => `${key}=${spec[key]}`)
      .join('|');

  return {
    get(spec) {
      const key = keyOf(spec);
      if (!cache.has(key)) cache.set(key, Object.freeze({ ...spec }));
      return cache.get(key);
    },
    size: () => cache.size,
  };
}

// The style is *intrinsic* state — shared, identical for many owners.
// The text is *extrinsic* state — different per cell, so it stays on
// the cell and never moves into the flyweight.
const CELLS = Array.from({ length: 300 }, (_, i) => ({
  text: `r${i}`,
  spec: [
    { color: 'black', bold: false },
    { color: 'red', bold: true },
    { bold: false, color: 'black' },
  ][i % 3],
}));

const styleCells = (cells, styles) =>
  cells.map((cell) => ({ text: cell.text, style: styles.get(cell.spec) }));

// ──────────────────────────── tests ──────────────────────────────────────

test('get returns the style that was asked for', () => {
  const styles = createStyleFactory();
  eq(styles.get({ color: 'red', bold: true }), { color: 'red', bold: true });
});

test('two equal specs get the identical object', () => {
  const styles = createStyleFactory();
  const a = styles.get({ color: 'red', bold: true });
  const b = styles.get({ color: 'red', bold: true });
  ok(a === b, 'expected the same object back, not a copy');
});

test('key order does not change the identity', () => {
  const styles = createStyleFactory();
  const a = styles.get({ color: 'black', bold: false });
  const b = styles.get({ bold: false, color: 'black' });
  ok(a === b, 'the cache key must be canonical');
  eq(styles.size(), 1);
});

test('different specs are different objects', () => {
  const styles = createStyleFactory();
  const a = styles.get({ color: 'black', bold: false });
  const b = styles.get({ color: 'black', bold: true });
  ok(a !== b);
  eq(styles.size(), 2);
});

test('size counts distinct styles, not requests', () => {
  const styles = createStyleFactory();
  for (let i = 0; i < 50; i += 1) styles.get({ color: 'red', bold: true });
  eq(styles.size(), 1);
});

test('a shared style cannot be edited by one of its owners', () => {
  const styles = createStyleFactory();
  const style = styles.get({ color: 'red', bold: true });
  throws(() => {
    style.color = 'blue';
  });
  eq(styles.get({ color: 'red', bold: true }).color, 'red');
});

test('300 cells share exactly two style objects', () => {
  const styles = createStyleFactory();
  const cells = styleCells(CELLS, styles);
  eq(cells.length, 300);
  eq(new Set(cells.map((cell) => cell.style)).size, 2);
  eq(styles.size(), 2);
  eq(cells[0].text, 'r0');
});
