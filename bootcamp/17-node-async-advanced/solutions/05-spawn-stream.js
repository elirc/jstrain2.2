// ─────────────────────────────────────────────────────────────────────────
//  05 · spawn and stream the output — SOLUTION                 ★★☆ core
//  run: node 05-spawn-stream.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: spawn returns immediately with a ChildProcess whose
//  stdout and stderr are Readable streams. Subscribe to 'data' and push
//  each Buffer; the split points are decided by the OS pipe, not by you,
//  so 'ab' can arrive as one chunk or as two — the only safe move is to
//  keep appending. Wait for 'close' rather than 'exit': 'exit' fires when
//  the process is gone but the pipes may still have buffered bytes,
//  'close' fires once the stdio streams are drained too. Reading the exit
//  code out instead of rejecting keeps the caller in charge of what
//  counts as failure — grep exits 1 for "no match", which is not an
//  error. Wrong turn: `chunk` is a Buffer; concatenating it with `+`
//  works only because JS calls toString() for you, and that silently
//  corrupts multi-byte characters split across a chunk boundary. Collect
//  Buffers and decode once when the size is unknown.

import { test, eq, ok } from '../../_lib/check.js';
import { spawn } from 'node:child_process';

export function spawnNode(source) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', source]);
    const chunks = [];
    const errChunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk.toString('utf8')));
    child.stderr.on('data', (chunk) => errChunks.push(chunk.toString('utf8')));
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, out: chunks.join(''), err: errChunks.join(''), chunks });
    });
  });
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
