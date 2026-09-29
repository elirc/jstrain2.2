// ─────────────────────────────────────────────────────────────────────────
//  29 · parsing and comparing semver                         ★★★ stretch
//  concepts: named groups · mixed-type compare · sort comparators
//  run: node 29-semver-compare.js
// ─────────────────────────────────────────────────────────────────────────
//
//  '1.10.0' is newer than '1.9.0', but as strings '1.10.0' < '1.9.0'.
//  Every "why did the wrong version deploy" story starts there. Parse the
//  version into numbers, then compare field by field.
//
//      parseVersion('1.2.3')
//        → { major: 1, minor: 2, patch: 3, prerelease: [] }
//      parseVersion('1.0.0-beta.11')
//        → { major: 1, minor: 0, patch: 0, prerelease: ['beta', 11] }
//      parseVersion('1.2')            → null
//
//      compareVersions('1.10.0', '1.9.0')          →  1
//      compareVersions('1.0.0-rc.1', '1.0.0')      → -1
//      compareVersions('1.2.3', '1.2.3')           →  0
//      sortVersions(['1.10.0', '1.2.3', '1.9.0'])
//        → ['1.2.3', '1.9.0', '1.10.0']
//
//  The semver precedence rules you need:
//   · major, then minor, then patch — as numbers;
//   · a version WITH a prerelease comes before the same version without;
//   · prerelease identifiers compare one by one: all-digit ones as
//     numbers, and a numeric identifier always loses to a text one;
//   · if one runs out of identifiers first, the shorter one wins.
//
//  hint: return -1 / 0 / 1 and chain the fields with `||` — 0 is falsy,
//  so `cmp(a.major, b.major) || cmp(a.minor, b.minor) || …` reads as
//  "first difference wins".

import { test, eq } from '../../_lib/check.js';

export function parseVersion(text) {
  throw new Error('TODO');
}

export function compareVersions(a, b) {
  throw new Error('TODO');
}

export function sortVersions(versions) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parseVersion returns numbers, not strings', () => {
  eq(parseVersion('1.2.3'), { major: 1, minor: 2, patch: 3, prerelease: [] });
  eq(parseVersion('10.0.7').major, 10);
});

test('parseVersion splits the prerelease into identifiers', () => {
  eq(parseVersion('1.0.0-beta.11').prerelease, ['beta', 11]);
  eq(parseVersion('2.0.0-rc').prerelease, ['rc']);
});

test('parseVersion returns null for anything that is not a version', () => {
  eq(parseVersion('1.2'), null);
  eq(parseVersion('v1.2.3'), null);
  eq(parseVersion('1.2.3.4'), null);
});

test('compareVersions compares numerically, not as text', () => {
  eq(compareVersions('1.10.0', '1.9.0'), 1);
  eq(compareVersions('1.9.0', '1.10.0'), -1);
  eq(compareVersions('2.0.0', '10.0.0'), -1);
});

test('compareVersions returns 0 for the same version', () => {
  eq(compareVersions('1.2.3', '1.2.3'), 0);
  eq(compareVersions('1.0.0-rc.1', '1.0.0-rc.1'), 0);
});

test('a prerelease sorts before its own release', () => {
  eq(compareVersions('1.0.0-rc.1', '1.0.0'), -1);
  eq(compareVersions('1.0.0', '1.0.0-rc.1'), 1);
});

test('prerelease identifiers follow the semver rules', () => {
  eq(compareVersions('1.0.0-alpha.2', '1.0.0-alpha.10'), -1);
  eq(compareVersions('1.0.0-alpha', '1.0.0-beta'), -1);
  eq(compareVersions('1.0.0-1', '1.0.0-alpha'), -1);
  eq(compareVersions('1.0.0-alpha', '1.0.0-alpha.1'), -1);
});

test('sortVersions sorts ascending and leaves the input alone', () => {
  const input = ['1.10.0', '1.2.3', '1.9.0', '1.0.0-rc.1', '1.0.0'];
  eq(sortVersions(input), ['1.0.0-rc.1', '1.0.0', '1.2.3', '1.9.0', '1.10.0']);
  eq(input[0], '1.10.0');
});
