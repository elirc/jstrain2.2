// ─────────────────────────────────────────────────────────────────────────
//  06 · write to a child's stdin — SOLUTION                 ★★★ stretch
//  run: node 06-child-stdin.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: spawn gives you three pipes by default. stdout you read;
//  stdin you write. The one non-obvious part is `end()` — a pipe stays
//  open until somebody closes it, and the child's 'end' event (its cue to
//  produce output) never fires while ours is open. `stdin.end(text)`
//  writes the payload and closes in one call, which is why the empty-
//  string case still produces an answer instead of a 5-second timeout.
//  Resolve on 'close', not 'exit', so the last stdout bytes are in. The
//  1500-repetition case is the second lesson: writes larger than the OS
//  pipe buffer are split, so both sides must keep appending rather than
//  assuming one write equals one read.
//  Wrong turn: forgetting the 'error' handler. If the executable is
//  missing, spawn reports it asynchronously on the child object — with no
//  listener you get an uncaught exception instead of a rejected promise.

import { test, eq, ok } from '../../_lib/check.js';
import { spawn } from 'node:child_process';

// Provided: the child program. It reads every byte of stdin, then shouts.
export const UPPERCASER = [
  "let text = '';",
  "process.stdin.on('data', (chunk) => { text += chunk; });",
  "process.stdin.on('end', () => process.stdout.write(text.toUpperCase()));",
].join('\n');

export function uppercaseInChild(text) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', UPPERCASER]);
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', () => resolve(Buffer.concat(chunks).toString('utf8')));
    child.stdin.end(text); // write AND close — the child waits for the close
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('shouts back what you sent', async () => {
  eq(await uppercaseInChild('hello'), 'HELLO');
});

test('an empty payload comes back empty — you closed stdin', async () => {
  eq(await uppercaseInChild(''), '');
});

test('newlines and punctuation survive the round trip', async () => {
  eq(await uppercaseInChild('one\ntwo!\n'), 'ONE\nTWO!\n');
});

test('digits and symbols are passed through unchanged', async () => {
  eq(await uppercaseInChild('a1-b2 %'), 'A1-B2 %');
});

test('a payload bigger than one chunk arrives whole', async () => {
  const big = 'ab'.repeat(1500);
  const result = await uppercaseInChild(big);
  eq(result.length, big.length);
  eq(result, big.toUpperCase());
});

test('two runs do not share state', async () => {
  const [first, second] = await Promise.all([
    uppercaseInChild('first'),
    uppercaseInChild('second'),
  ]);
  eq(first, 'FIRST');
  eq(second, 'SECOND');
  ok(first !== second, 'each child should answer its own input');
});
