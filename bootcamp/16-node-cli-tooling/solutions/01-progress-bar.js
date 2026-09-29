// ─────────────────────────────────────────────────────────────────────────
//  01 · progress bar — SOLUTION                            ★☆☆ warm-up
//  run: node 01-progress-bar.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: clamp first, then divide, then build. Clamping `current`
//  once at the top means every later line — the label, the percentage and
//  the cell count — agrees on the same number; clamping only the bar makes
//  a bar that says 100% next to a label reading (12/10).
//  The `total <= 0` guard is the one that bites: 0/0 is NaN, and NaN
//  spreads to '[NaN...] NaN%'. "Nothing to do" is done, so ratio = 1.
//  Math.round on the cell count keeps the bar honest at both ends —
//  Math.ceil shows a filled cell at 1%, Math.floor never fills the last.

import { test, eq } from '../../_lib/check.js';

export function renderBar(current, total, width) {
  const done = Math.max(0, Math.min(current, total));
  const ratio = total > 0 ? done / total : 1;
  const filled = Math.round(ratio * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const percent = Math.round(ratio * 100);
  return `[${bar}] ${percent}% (${done}/${total})`;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('renders a half-full bar', () => {
  eq(renderBar(5, 10, 8), '[████░░░░] 50% (5/10)');
});

test('renders the empty and the full ends', () => {
  eq(renderBar(0, 10, 8), '[░░░░░░░░] 0% (0/10)');
  eq(renderBar(10, 10, 8), '[████████] 100% (10/10)');
});

test('rounds the cell count to the nearest cell', () => {
  eq(renderBar(1, 3, 6), '[██░░░░] 33% (1/3)');
});

test('clamps a current outside the range, label included', () => {
  eq(renderBar(-3, 10, 4), '[░░░░] 0% (0/10)');
  eq(renderBar(12, 10, 4), '[████] 100% (10/10)');
});

test('a total of 0 is 100%, not NaN', () => {
  eq(renderBar(0, 0, 4), '[████] 100% (0/0)');
});

test('a width of 0 still reports the percentage', () => {
  eq(renderBar(2, 3, 0), '[] 67% (2/3)');
});
