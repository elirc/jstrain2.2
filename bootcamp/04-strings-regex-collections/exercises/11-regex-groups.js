// ─────────────────────────────────────────────────────────────────────────
//  11 · capture groups                                          ★★☆ core
//  concepts: capture groups · named groups · matchAll
//  run: node 11-regex-groups.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Parentheses do two jobs: they group, and they CAPTURE. A successful
//  match array holds the whole match at [0] and each group after it.
//
//      splitVersion('2.14.3')  → [2, 14, 3]     (numbers, not strings)
//      splitVersion('v2.14')   → null
//
//      parseLogLine('2026-08-20 ERROR disk full')
//        → { date: '2026-08-20', level: 'ERROR', message: 'disk full' }
//      parseLogLine('junk')  → null
//
//      allTags('<b>hi</b> and <i>there</i>')  → ['b', 'i']
//
//  Named groups — (?<level>[A-Z]+) — land on match.groups. allTags wants
//  every opening tag NAME, in order, duplicates kept; matchAll gives you
//  one match array per hit (and REQUIRES the g flag).
//
//  hint: match.groups is a null-prototype object; spread it into a plain
//  { ...match.groups } before returning it.

import { test, eq, ok } from '../../_lib/check.js';

export function splitVersion(version) {
  throw new Error('TODO');
}

export function parseLogLine(line) {
  throw new Error('TODO');
}

export function allTags(html) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('splitVersion returns the three parts', () => {
  eq(splitVersion('2.14.3'), [2, 14, 3]);
});

test('splitVersion returns numbers, not strings', () => {
  ok(typeof splitVersion('1.0.0')[0] === 'number');
});

test('splitVersion returns null for anything else', () => {
  eq(splitVersion('v2.14'), null);
  eq(splitVersion('1.2.3.4'), null);
});

test('parseLogLine names its parts', () => {
  eq(parseLogLine('2026-08-20 ERROR disk full'), {
    date: '2026-08-20',
    level: 'ERROR',
    message: 'disk full',
  });
});

test('parseLogLine keeps the whole message, spaces and all', () => {
  eq(parseLogLine('2026-01-02 WARN a b c').message, 'a b c');
});

test('parseLogLine returns null when the line does not fit', () => {
  eq(parseLogLine('junk'), null);
});

test('allTags collects every opening tag name in order', () => {
  eq(allTags('<b>hi</b> and <i>there</i>'), ['b', 'i']);
});

test('allTags keeps duplicates and returns [] when there are none', () => {
  eq(allTags('<b>a</b><b>c</b>'), ['b', 'b']);
  eq(allTags('plain text'), []);
});
