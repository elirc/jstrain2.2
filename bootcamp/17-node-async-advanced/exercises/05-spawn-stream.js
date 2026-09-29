// ─────────────────────────────────────────────────────────────────────────
//  05 · spawn and stream the output                            ★★☆ core
//  concepts: child_process.spawn · stdio streams · close event
//  run: node 05-spawn-stream.js
// ─────────────────────────────────────────────────────────────────────────
//
//  execFile buffers the whole output in memory and only calls you back at
//  the end. `spawn` hands you the pipes instead, so you see output as it
//  arrives — the right tool for a long build log, and the only tool once
//  the output is bigger than you want in RAM.
//
//  Collect it chunk by chunk and report what happened:
//
//      await spawnNode("process.stdout.write('hi')")
//        → { code: 0, out: 'hi', err: '', chunks: ['hi'] }
//
//      await spawnNode('process.exit(2)')
//        → { code: 2, out: '', err: '', chunks: [] }
//
//  `chunks` is every stdout piece you received, as strings, in order.
//  A non-zero exit is NOT an error here — report the code and move on.
//
//  hint: 'data' events give you Buffers; the 'close' event carries the
//  exit code and fires after both pipes have ended

import { test, eq, ok } from '../../_lib/check.js';
import { spawn } from 'node:child_process';

export function spawnNode(source) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('collects what the child wrote to stdout', async () => {
  const result = await spawnNode("process.stdout.write('hello')");
  eq(result.out, 'hello');
  eq(result.code, 0);
});

test('collects stderr separately', async () => {
  const result = await spawnNode("process.stderr.write('warned')");
  eq(result.err, 'warned');
  eq(result.out, '');
});

test('reports a non-zero exit code instead of rejecting', async () => {
  const result = await spawnNode("process.stdout.write('bye'); process.exit(2);");
  eq(result.code, 2);
  eq(result.out, 'bye');
});

test('keeps every chunk, even when they arrive far apart', async () => {
  const result = await spawnNode(
    "process.stdout.write('a'); setTimeout(() => process.stdout.write('b'), 25);"
  );
  eq(result.out, 'ab');
});

test('the chunks join back into the full output', async () => {
  const result = await spawnNode("process.stdout.write('chunky')");
  ok(Array.isArray(result.chunks), 'chunks should be an array');
  ok(result.chunks.length >= 1, 'expected at least one chunk');
  eq(result.chunks.join(''), result.out);
});

test('a silent program gives empty strings, not undefined', async () => {
  const result = await spawnNode('0;');
  eq(result.out, '');
  eq(result.err, '');
  eq(result.code, 0);
});
