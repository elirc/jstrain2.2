// ─────────────────────────────────────────────────────────────────────────
//  15 · snapshot testing — SOLUTION                          ★★★ stretch
//  run: node 15-snapshot-testing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a snapshot test is a diff against a file you blessed once.
//  Four states, and the file's existence picks between them: absent →
//  write and pass, same → pass, different → fail, different + an env flag →
//  rewrite. That is jest's `toMatchSnapshot` and `-u`, entire.
//  The env comes in as a PARAMETER, not from `process.env` inside the
//  function. Same lesson as the clock in exercise 05: a unit that reaches
//  for a global cannot be driven from a test, and here you would have to
//  mutate real process state and remember to put it back.
//  The UPDATE branch belongs ONLY on the mismatch path. Write on every run
//  and the test can never fail — the single most common way snapshot
//  suites rot into decoration. The other way they rot is nobody reading
//  the diff before running with -u; a snapshot you re-bless without
//  reading is a snapshot that has stopped testing anything.
//  The trailing newline is not decoration either: it makes the files
//  behave in git diffs and text editors. And names are sanitised because
//  test titles contain spaces, slashes and colons, none of which you want
//  to hand to the filesystem.

import { test, eq, ok } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

// Provided: every test gets its own directory, removed afterwards.
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

function withTempDir(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  mkdirSync(dir, { recursive: true });
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    try {
      rmdirSync(TMP_ROOT); // only succeeds once the last test is done
    } catch {
      /* still in use, or already gone */
    }
  }
}

export function snapshotTest(name, value, { dir, env = {} }) {
  const safeName = name.replace(/[^a-z0-9._-]+/gi, '-');
  const file = path.join(dir, `${safeName}.snap.json`);
  const actual = `${JSON.stringify(value, null, 2)}\n`;

  mkdirSync(dir, { recursive: true });

  if (!existsSync(file)) {
    writeFileSync(file, actual, 'utf8');
    return { status: 'written', path: file };
  }

  const expected = readFileSync(file, 'utf8');
  if (expected === actual) return { status: 'matched', path: file };

  if (env.UPDATE_SNAPSHOTS) {
    writeFileSync(file, actual, 'utf8');
    return { status: 'updated', path: file };
  }
  return { status: 'mismatch', path: file, expected, actual };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the first run writes the snapshot', () => {
  withTempDir((dir) => {
    const result = snapshotTest('card', { title: 'Hi' }, { dir });
    eq(result.status, 'written');
    ok(existsSync(result.path), 'the snapshot file should exist');
  });
});

test('the file holds the pretty-printed value plus a newline', () => {
  withTempDir((dir) => {
    const result = snapshotTest('card', { title: 'Hi' }, { dir });
    eq(readFileSync(result.path, 'utf8'), '{\n  "title": "Hi"\n}\n');
  });
});

test('a second run with the same value matches', () => {
  withTempDir((dir) => {
    snapshotTest('card', { title: 'Hi', tags: ['a'] }, { dir });
    const again = snapshotTest('card', { title: 'Hi', tags: ['a'] }, { dir });
    eq(again.status, 'matched');
  });
});

test('a changed value is a mismatch that shows both sides', () => {
  withTempDir((dir) => {
    snapshotTest('card', { title: 'Hi' }, { dir });
    const result = snapshotTest('card', { title: 'Bye' }, { dir });
    eq(result.status, 'mismatch');
    eq(result.expected, '{\n  "title": "Hi"\n}\n');
    eq(result.actual, '{\n  "title": "Bye"\n}\n');
  });
});

test('a mismatch does NOT rewrite the file', () => {
  withTempDir((dir) => {
    const first = snapshotTest('card', { title: 'Hi' }, { dir });
    snapshotTest('card', { title: 'Bye' }, { dir });
    eq(readFileSync(first.path, 'utf8'), '{\n  "title": "Hi"\n}\n');
  });
});

test('UPDATE_SNAPSHOTS rewrites, and the next run matches again', () => {
  withTempDir((dir) => {
    snapshotTest('card', { title: 'Hi' }, { dir });
    const env = { UPDATE_SNAPSHOTS: '1' };
    const updated = snapshotTest('card', { title: 'Bye' }, { dir, env });
    eq(updated.status, 'updated');
    eq(readFileSync(updated.path, 'utf8'), '{\n  "title": "Bye"\n}\n');
    eq(snapshotTest('card', { title: 'Bye' }, { dir }).status, 'matched');
  });
});

test('the test name becomes a safe file name', () => {
  withTempDir((dir) => {
    const result = snapshotTest('renders a card', { ok: true }, { dir });
    eq(path.basename(result.path), 'renders-a-card.snap.json');
  });
});

test('different names get different files, and a missing dir is created', () => {
  withTempDir((dir) => {
    const nested = path.join(dir, 'deep', 'snapshots');
    const a = snapshotTest('a', { v: 1 }, { dir: nested });
    const b = snapshotTest('b', { v: 2 }, { dir: nested });
    ok(a.path !== b.path, 'two names must not share a file');
    eq(snapshotTest('a', { v: 1 }, { dir: nested }).status, 'matched');
    eq(snapshotTest('b', { v: 1 }, { dir: nested }).status, 'mismatch');
  });
});
