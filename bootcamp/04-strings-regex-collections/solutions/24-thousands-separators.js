// ─────────────────────────────────────────────────────────────────────────
//  24 · inserting thousands separators — SOLUTION            ★★★ stretch
//  run: node 24-thousands-separators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: /(?<=\d)(?=(?:\d{3})+$)/g matches nothing at all — it is
//  two assertions back to back, so every "match" is an empty string at a
//  position. Replacing an empty match with ',' inserts without deleting.
//  The lookbehind (?<=\d) is what keeps the comma off the front: at the
//  position between '-' and '1' there is no digit behind, so '-1000'
//  cannot become '-,1000'. The lookahead counts the digits that follow in
//  blocks of three and pins them to $ — without the anchor, '(\d{3})+'
//  would happily match the first three of four digits and you would get
//  '1,2,3,4,5,6,7'.
//  Trap two: the fraction. '1234.5678' has a second run of digits, and
//  the regex knows nothing about the dot — '.5678' ends the string, so it
//  gets a comma too ('1,234.5,678'). Slice the fraction off first, group
//  the integer part, glue it back. That is why the '.' is handled with
//  indexOf and not inside the pattern.

import { test, eq } from '../../_lib/check.js';

export function groupThousands(numberText) {
  const dot = numberText.indexOf('.');
  const whole = dot === -1 ? numberText : numberText.slice(0, dot);
  const fraction = dot === -1 ? '' : numberText.slice(dot);
  return whole.replace(/(?<=\d)(?=(?:\d{3})+$)/g, ',') + fraction;
}

export function parseGrouped(text) {
  return Number(text.replaceAll(',', ''));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('groups a long integer every three digits', () => {
  eq(groupThousands('1234567'), '1,234,567');
  eq(groupThousands('1000'), '1,000');
});

test('leaves three digits or fewer alone', () => {
  eq(groupThousands('999'), '999');
  eq(groupThousands('12'), '12');
  eq(groupThousands('0'), '0');
});

test('never groups the digits after the decimal point', () => {
  eq(groupThousands('1234.5678'), '1,234.5678');
  eq(groupThousands('0.123456'), '0.123456');
});

test('groups the integer part of a long decimal', () => {
  eq(groupThousands('9876543.21'), '9,876,543.21');
});

test('keeps a leading minus and puts no comma after it', () => {
  eq(groupThousands('-1000'), '-1,000');
  eq(groupThousands('-999'), '-999');
  eq(groupThousands('-1234567.5'), '-1,234,567.5');
});

test('parseGrouped strips the separators and returns a number', () => {
  eq(parseGrouped('1,234.5'), 1234.5);
  eq(parseGrouped('1,000,000'), 1000000);
  eq(parseGrouped('42'), 42);
});

test('parseGrouped keeps the sign', () => {
  eq(parseGrouped('-1,234'), -1234);
});

test('the two functions round-trip', () => {
  for (const n of [0, 7, 1234, 1234567, -98765.25]) {
    eq(parseGrouped(groupThousands(String(n))), n);
  }
});
