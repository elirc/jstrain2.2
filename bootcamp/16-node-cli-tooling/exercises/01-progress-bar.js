// ─────────────────────────────────────────────────────────────────────────
//  01 · progress bar                                       ★☆☆ warm-up
//  concepts: strings · arithmetic · pure functions
//  run: node 01-progress-bar.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A progress bar is not an animation, it is a string. Build the string
//  here; some other layer decides when to reprint it. `width` is the
//  number of cells between the brackets — '█' for done, '░' for not.
//
//      renderBar(5, 10, 8)   → '[████░░░░] 50% (5/10)'
//      renderBar(0, 10, 8)   → '[░░░░░░░░] 0% (0/10)'
//      renderBar(10, 10, 8)  → '[████████] 100% (10/10)'
//
//  Rules: clamp `current` into 0..total (a download that over-reports
//  must not print 11 cells in a 10-cell bar), round the cell count and
//  the percentage to the nearest integer, and treat a total of 0 as
//  finished rather than as a division by zero.
//
//  hint: '█'.repeat(n) — and decide what ratio 0/0 should be BEFORE you
//  divide

import { test, eq } from '../../_lib/check.js';

export function renderBar(current, total, width) {
  throw new Error('TODO');
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
