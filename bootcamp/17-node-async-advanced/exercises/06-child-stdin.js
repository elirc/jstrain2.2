// ─────────────────────────────────────────────────────────────────────────
//  06 · write to a child's stdin                            ★★★ stretch
//  concepts: child stdio · pipes · end-of-input
//  run: node 06-child-stdin.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Output is only half of a pipe. Plenty of tools — sort, jq, ffmpeg, a
//  language server — want their input on stdin, and a child you never
//  close stdin on will sit there waiting forever.
//
//  UPPERCASER (below) is a tiny Node program that reads all of stdin and
//  prints it back shouted. Drive it:
//
//      await uppercaseInChild('hello')     → 'HELLO'
//      await uppercaseInChild('a\nb')      → 'A\nB'
//      await uppercaseInChild('')          → ''
//
//  That last one is the whole exercise in one case: the child only sees
//  'end' — and therefore only prints — once you close its stdin.
//
//  hint: child.stdin is a Writable. `child.stdin.end(text)` writes and
//  closes in one call; without the close, this test file times out

import { test, eq, ok } from '../../_lib/check.js';
import { spawn } from 'node:child_process';

// Provided: the child program. It reads every byte of stdin, then shouts.
export const UPPERCASER = [
  "let text = '';",
  "process.stdin.on('data', (chunk) => { text += chunk; });",
  "process.stdin.on('end', () => process.stdout.write(text.toUpperCase()));",
].join('\n');

export function uppercaseInChild(text) {
  throw new Error('TODO');
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
