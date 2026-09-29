// ─────────────────────────────────────────────────────────────────────────
//  11 · capture groups — SOLUTION                               ★★☆ core
//  run: node 11-regex-groups.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a match array is [whole, group1, group2, ...]. splitVersion
//  destructures past the whole match with a leading comma hole, then maps
//  the three strings through Number — regex only ever hands back strings,
//  which is the conversion people forget.
//  parseLogLine uses NAMED groups, (?<level>...), so the caller reads
//  m.groups.level instead of m[2] and stays correct when a group moves.
//  m.groups is a null-prototype object, so it is spread into a plain
//  object before returning — otherwise a deep-equal against a normal
//  object literal fails on the prototype.
//  allTags uses matchAll, which needs the g flag (it throws without it)
//  and yields one match array per hit, so m[1] is the tag name. </b> is
//  skipped for free because \w does not match '/'.

import { test, eq, ok } from '../../_lib/check.js';

export function splitVersion(version) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (m === null) return null;
  const [, major, minor, patch] = m;
  return [Number(major), Number(minor), Number(patch)];
}

export function parseLogLine(line) {
  const m = line.match(/^(?<date>\S+) (?<level>[A-Z]+) (?<message>.+)$/);
  return m === null ? null : { ...m.groups };
}

export function allTags(html) {
  return [...html.matchAll(/<(\w+)>/g)].map((m) => m[1]);
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
