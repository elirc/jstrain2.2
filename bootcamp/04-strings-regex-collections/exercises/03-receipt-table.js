// ─────────────────────────────────────────────────────────────────────────
//  03 · receipt table                                          ★★☆ core
//  concepts: padStart · padEnd · repeat · toFixed
//  run: node 03-receipt-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Print a fixed-width receipt in a terminal. Prices are stored as whole
//  CENTS (integers) so no float ever touches the arithmetic.
//
//      money(350)                     → '$3.50'
//      formatLine('Coffee', 350, 20)  → 'Coffee         $3.50'   (20 wide)
//      divider(5)                     → '-----'
//
//      receipt([['Coffee', 350], ['Bagel', 225]], 20)
//        → 'Coffee         $3.50\n'
//        + 'Bagel          $2.25\n'
//        + '--------------------\n'
//        + 'TOTAL          $5.75'
//
//  Every line is exactly `width` characters: the name is padded on the
//  right, the price pushed to the right edge. The total row uses the name
//  'TOTAL' and the same layout.
//
//  hint: padEnd fills the name, padStart right-aligns — but you only need
//  one of them if you compute `width - price.length`.

import { test, eq } from '../../_lib/check.js';

export function money(cents) {
  throw new Error('TODO');
}

export function divider(width) {
  throw new Error('TODO');
}

export function formatLine(name, cents, width) {
  throw new Error('TODO');
}

export function receipt(items, width) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('money turns cents into dollars with two decimals', () => {
  eq(money(350), '$3.50');
  eq(money(575), '$5.75');
});

test('money keeps the trailing zeros on small amounts', () => {
  eq(money(5), '$0.05');
  eq(money(0), '$0.00');
});

test('divider repeats a dash', () => {
  eq(divider(5), '-----');
});

test('formatLine right-aligns the price', () => {
  eq(formatLine('Coffee', 350, 20), 'Coffee         $3.50');
});

test('formatLine makes every line exactly `width` wide', () => {
  eq(formatLine('Tea', 75, 20).length, 20);
  eq(formatLine('Cinnamon roll', 1250, 20).length, 20);
});

test('receipt stacks the items, a divider, and the total', () => {
  eq(
    receipt(
      [
        ['Coffee', 350],
        ['Bagel', 225],
      ],
      20
    ),
    'Coffee         $3.50\n' +
      'Bagel          $2.25\n' +
      '--------------------\n' +
      'TOTAL          $5.75'
  );
});

test('receipt totals in cents, so no float dust appears', () => {
  const lines = receipt(
    [
      ['A', 10],
      ['B', 20],
      ['C', 3],
    ],
    12
  ).split('\n');
  eq(lines.at(-1), 'TOTAL  $0.33');
});

test('receipt works with a single item', () => {
  const lines = receipt([['Water', 199]], 16).split('\n');
  eq(lines.length, 3);
  eq(lines[0], 'Water      $1.99');
});
