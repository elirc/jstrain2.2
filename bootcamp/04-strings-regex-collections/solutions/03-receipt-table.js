// ─────────────────────────────────────────────────────────────────────────
//  03 · receipt table — SOLUTION                                ★★☆ core
//  run: node 03-receipt-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: money divides by 100 once, at the very edge, and hands
//  toFixed(2) a value that is already correct — the whole reason to keep
//  prices in integer cents. Add 0.1 + 0.2 style floats and the total
//  drifts; add 10 + 20 + 3 cents and it never does.
//  formatLine computes the price string FIRST, then pads the name to
//  `width - price.length`. That single padEnd guarantees the total width,
//  which a padEnd(name)+padStart(price) pair only does by luck.
//  receipt is map → reduce → join: lines for the items, one divider, one
//  more formatLine for the total row, all joined with '\n'.

import { test, eq } from '../../_lib/check.js';

export function money(cents) {
  return '$' + (cents / 100).toFixed(2);
}

export function divider(width) {
  return '-'.repeat(width);
}

export function formatLine(name, cents, width) {
  const price = money(cents);
  return name.padEnd(width - price.length) + price;
}

export function receipt(items, width) {
  const lines = items.map(([name, cents]) => formatLine(name, cents, width));
  const total = items.reduce((sum, [, cents]) => sum + cents, 0);
  lines.push(divider(width), formatLine('TOTAL', total, width));
  return lines.join('\n');
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
