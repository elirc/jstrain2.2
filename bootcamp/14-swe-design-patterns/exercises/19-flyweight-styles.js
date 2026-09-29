// ─────────────────────────────────────────────────────────────────────────
//  19 · flyweight styles                                     ★☆☆ warm-up
//  concepts: flyweight · interning · object identity
//  run: node exercises/19-flyweight-styles.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A spreadsheet renders 50,000 cells, but the whole sheet uses maybe six
//  distinct styles. One style object per cell burns memory for nothing.
//
//  Build a factory that hands back a SHARED frozen style per distinct
//  spec, so two equal specs get the identical object back:
//
//      const styles = createStyleFactory();
//      styles.get({ color: 'red', bold: true })
//        === styles.get({ bold: true, color: 'red' })   → true
//      styles.size()                                    → 1
//
//  Key order must not matter. Shared objects must be frozen — one cell
//  must never be able to restyle every other cell that shares its style.
//
//  hint: reduce each spec to one canonical string key; sort the keys

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createStyleFactory() {
  throw new Error('TODO');
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
