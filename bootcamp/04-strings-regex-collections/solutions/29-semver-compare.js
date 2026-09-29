// ─────────────────────────────────────────────────────────────────────────
//  29 · parsing and comparing semver — SOLUTION              ★★★ stretch
//  run: node 29-semver-compare.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: parse once into a struct of numbers, then never look at
//  the text again. The regex is anchored so '1.2.3.4' and 'v1.2.3' are
//  rejected instead of half-parsed, and each prerelease identifier is
//  turned into a number when it is all digits — that single map() is what
//  makes 'alpha.2' < 'alpha.10' work later.
//  compareVersions is a chain of cmp() calls joined with ||: cmp returns
//  0 for "same", which is falsy, so the first non-zero answer wins and
//  the rest is never evaluated. Returning b - a somewhere in that chain
//  is the classic wrong turn — it works for sort() but breaks the -1/0/1
//  contract the tests (and readers) expect.
//  comparePrerelease encodes the three rules that trip people up: an
//  EMPTY prerelease list means "the real release", which sorts LAST, not
//  first; a numeric identifier always loses to a text one; and when one
//  list is a prefix of the other, fewer identifiers wins.

import { test, eq } from '../../_lib/check.js';

const VERSION =
  /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<pre>[0-9A-Za-z.-]+))?$/;

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function parseVersion(text) {
  const m = VERSION.exec(text);
  if (m === null) return null;
  const { major, minor, patch, pre } = m.groups;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease:
      pre === undefined
        ? []
        : pre.split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id)),
  };
}

function comparePrerelease(a, b) {
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1; // a is the finished release: it sorts last
  if (b.length === 0) return -1;

  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    const xIsNumber = typeof x === 'number';
    const yIsNumber = typeof y === 'number';
    if (xIsNumber !== yIsNumber) return xIsNumber ? -1 : 1;
    return cmp(x, y);
  }
  return cmp(a.length, b.length);
}

export function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (left === null || right === null) throw new Error(`not a version: ${a} / ${b}`);
  return (
    cmp(left.major, right.major) ||
    cmp(left.minor, right.minor) ||
    cmp(left.patch, right.patch) ||
    comparePrerelease(left.prerelease, right.prerelease)
  );
}

export function sortVersions(versions) {
  return [...versions].sort(compareVersions);
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
