// ─────────────────────────────────────────────────────────────────────────
//  37 · raw templates                                           ★★☆ core
//  concepts: String.raw · escape sequences · nested template literals
//  run: node 37-raw-templates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  In a normal template literal a backslash starts an escape sequence, and
//  an unrecognised one is silently dropped: `C:\Users\ada` is the string
//  'C:Usersada'. String.raw is the tag that hands you the characters you
//  actually typed — still interpolating ${...} as usual.
//
//      windowsPath('C')  → 'C:\Users\ada\AppData'   (3 real backslashes)
//      digitPattern(3)   → /^\d{3}$/                (source '^\d{3}$')
//
//  digitPattern(n) returns a RegExp matching exactly n digits, built from
//  a raw string — no '\\d', no doubling of anything.
//
//      menu('Drinks', ['Tea', 'Coffee'])
//      →
//          Drinks
//            1. Tea
//            2. Coffee
//
//      menu('Drinks', [])  → 'Drinks\n  (nothing)'
//
//  Item lines are two spaces, the 1-based number, '. ', then the item.
//  No trailing newline. Build the body with a template inside a template.
//
//  hint: String.raw is a tag, so it goes directly before the backtick:
//  String.raw`^\d{${count}}$`. One thing survives raw mode: `\$` still
//  escapes the dollar, so a hole cannot sit directly after a backslash —
//  which is why the drive letter, not the user name, is the parameter.

import { test, eq, ok } from '../../_lib/check.js';

export function windowsPath(drive) {
  throw new Error('TODO');
}

export function digitPattern(count) {
  throw new Error('TODO');
}

export function menu(title, items) {
  throw new Error('TODO');
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
