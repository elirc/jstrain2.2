// ─────────────────────────────────────────────────────────────────────────
//  06 · ANSI styling                                       ★★☆ core
//  concepts: escape codes · regex · string length vs display width
//  run: node 06-ansi-style.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Colour in a terminal is text. `\x1b[31m` means "red from here",
//  `\x1b[39m` means "back to the default colour". No library required.
//
//      color('err', 'red')     → '\x1b[31merr\x1b[39m'
//      bold('x')               → '\x1b[1mx\x1b[22m'
//      stripAnsi(bold('x'))    → 'x'
//      visibleLength(bold('x')) → 1        (bold('x').length is 9)
//
//  The STYLES table below holds [open, close] pairs. Closing with 0 would
//  reset EVERYTHING, so nested styles would fall apart — use the close
//  code from the table. An unknown style name must throw.
//
//  bold and dim are already written for you in terms of color().
//
//  hint: the escape is ESC, then '[', then digits and semicolons, then
//  'm' — /\x1b\[[0-9;]*m/g

import { test, eq, throws } from '../../_lib/check.js';

const STYLES = {
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  gray: [90, 39],
  bold: [1, 22],
  dim: [2, 22],
};

export function color(text, name) {
  throw new Error('TODO');
}

export const bold = (text) => color(text, 'bold');
export const dim = (text) => color(text, 'dim');

export function stripAnsi(text) {
  throw new Error('TODO');
}

export function visibleLength(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('wraps text in the open and close codes for the style', () => {
  eq(color('err', 'red'), '\x1b[31merr\x1b[39m');
  eq(color('ok', 'green'), '\x1b[32mok\x1b[39m');
});

test('bold and dim close with 22, not with 0', () => {
  eq(bold('x'), '\x1b[1mx\x1b[22m');
  eq(dim('x'), '\x1b[2mx\x1b[22m');
});

test('styles nest without cancelling each other', () => {
  eq(bold(color('go', 'green')), '\x1b[1m\x1b[32mgo\x1b[39m\x1b[22m');
});

test('an unknown style name throws instead of printing garbage', () => {
  throws(() => color('x', 'pink'), 'pink');
});

test('stripAnsi removes every escape sequence', () => {
  eq(stripAnsi(bold(color('hi', 'red'))), 'hi');
  eq(stripAnsi('plain text'), 'plain text');
  eq(stripAnsi(''), '');
});

test('stripAnsi leaves lookalike text alone', () => {
  eq(stripAnsi('[31mnot an escape[0m'), '[31mnot an escape[0m');
});

test('visibleLength is what padding has to be measured with', () => {
  const cell = color('hi', 'red');
  eq(cell.length, 12);
  eq(visibleLength(cell), 2);
  eq(cell.padEnd(5), cell);
  eq(cell + ' '.repeat(5 - visibleLength(cell)), '\x1b[31mhi\x1b[39m   ');
});
