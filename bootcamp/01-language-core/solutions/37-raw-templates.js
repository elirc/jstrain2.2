// ─────────────────────────────────────────────────────────────────────────
//  37 · raw templates — SOLUTION                                ★★☆ core
//  run: node 37-raw-templates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: String.raw is an ordinary tag function that returns
//  strings.raw joined with the interpolated values — the cooked escapes
//  are simply never used. That makes it the right tool for anything whose
//  syntax already owns the backslash: Windows paths, regex sources, LaTeX.
//
//  The trap it removes is silent. `\U` and `\a` are not escape sequences,
//  so a normal template drops the backslash and hands you 'C:Usersada'
//  with no warning. (`\x` and `\u` are worse — those are SyntaxErrors.)
//
//  The trap it does NOT remove: `\$` is still an escape, and it is applied
//  before raw mode ever matters, so `String.raw`a\${x}`` has no hole in it
//  at all. A substitution can never sit directly after a backslash — hence
//  the drive letter as the parameter here.
//
//  digitPattern shows why raw and interpolation belong together: the
//  pattern needs a literal \d AND a computed count. menu is the nesting
//  rep — a template literal inside the ${...} of another one is entirely
//  ordinary, and beats push-into-an-array for small renderers.

import { test, eq, ok } from '../../_lib/check.js';

export function windowsPath(drive) {
  return String.raw`${drive}:\Users\ada\AppData`;
}

export function digitPattern(count) {
  return new RegExp(String.raw`^\d{${count}}$`);
}

export function menu(title, items) {
  const body = items.length
    ? items.map((item, i) => `  ${i + 1}. ${item}`).join('\n')
    : '  (nothing)';
  return `${title}\n${body}`;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('windowsPath keeps every backslash, exactly once each', () => {
  eq(windowsPath('C'), 'C:\\Users\\ada\\AppData');
  eq(windowsPath('C').length, 20);
  eq(windowsPath('C').split('\\').length - 1, 3);
});

test('a plain template literal would have eaten them', () => {
  eq(windowsPath('C'), 'C:\\Users\\ada\\AppData');
  eq(`C:\Users\ada\AppData`, 'C:UsersadaAppData');
  eq(String.raw`\t`.length, 2);
  eq('\t'.length, 1);
});

test('the ${} holes interpolate — unless a backslash escapes', () => {
  eq(windowsPath('D'), 'D:\\Users\\ada\\AppData');
  ok(windowsPath('Z').startsWith('Z:'));
  eq(String.raw`a\${x}`, 'a\\${x}'); // \$ turns the hole off, even in raw
});

test('digitPattern builds a pattern source without doubling anything', () => {
  eq(digitPattern(3).source, '^\\d{3}$');
  ok(digitPattern(3) instanceof RegExp);
});

test('digitPattern matches exactly that many digits', () => {
  ok(digitPattern(3).test('123'));
  ok(!digitPattern(3).test('12'));
  ok(!digitPattern(3).test('1234'));
  ok(!digitPattern(3).test('12a'));
  ok(digitPattern(1).test('7'));
});

test('menu numbers the items from one', () => {
  eq(menu('Drinks', ['Tea', 'Coffee']), 'Drinks\n  1. Tea\n  2. Coffee');
  eq(menu('Drinks', ['Tea']), 'Drinks\n  1. Tea');
});

test('an empty list still gets a body line', () => {
  eq(menu('Drinks', []), 'Drinks\n  (nothing)');
  eq(menu('', []), '\n  (nothing)');
});

test('the title stands alone and there is no trailing newline', () => {
  const rendered = menu('Drinks', ['Tea', 'Coffee']);
  eq(rendered.split('\n')[0], 'Drinks');
  eq(rendered.split('\n').length, 3);
  ok(!rendered.endsWith('\n'));
});
