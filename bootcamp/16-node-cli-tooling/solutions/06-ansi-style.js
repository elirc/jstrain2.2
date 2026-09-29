// ─────────────────────────────────────────────────────────────────────────
//  06 · ANSI styling — SOLUTION                            ★★☆ core
//  run: node 06-ansi-style.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a style is an OPEN code and a CLOSE code, which is why the
//  table stores pairs. Closing with 0 ("reset everything") is the classic
//  bug: bold(color(x)) would end the bold as well as the colour, and the
//  rest of the line silently loses its styling. 39 closes only the
//  foreground colour, 22 closes only bold/dim, so styles nest.
//  stripAnsi is one regex — ESC '[' digits-and-semicolons 'm' — and
//  visibleLength is defined in terms of it rather than duplicating it.
//  That length is the whole reason this exercise comes before the table:
//  '\x1b[31mhi\x1b[39m'.length is 12, so padEnd(5) does nothing at all.

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
  const pair = STYLES[name];
  if (!pair) throw new Error(`unknown style: ${name}`);
  return `\x1b[${pair[0]}m${text}\x1b[${pair[1]}m`;
}

export const bold = (text) => color(text, 'bold');
export const dim = (text) => color(text, 'dim');

export function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

export function visibleLength(text) {
  return stripAnsi(text).length;
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
