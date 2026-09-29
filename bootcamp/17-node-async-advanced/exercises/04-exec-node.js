// ─────────────────────────────────────────────────────────────────────────
//  04 · exec a child process                                   ★★☆ core
//  concepts: child_process · execFile · promisify · exit codes
//  run: node 04-exec-node.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A worker thread shares your process. A child process does not — it is
//  a whole separate Node, with its own heap, its own event loop and its
//  own exit code. `execFile` runs one, buffers everything it prints, and
//  hands you the two streams when it is done.
//
//      await runNode("process.stdout.write('hi')")
//        → { stdout: 'hi', stderr: '' }
//
//      await runNode('process.exit(3)')      → REJECTS
//      the rejection carries err.code === 3 and err.stderr
//
//      await tryRunNode("process.stdout.write('ok')")
//        → { ok: true, stdout: 'ok' }
//      await tryRunNode("process.stderr.write('no'); process.exit(3);")
//        → { ok: false, code: 3, stderr: 'no' }
//
//  Both run `node -e <source>`; process.execPath is the node you are
//  already running, so this works with no PATH lookup.
//
//  hint: promisify(execFile) rejects on a non-zero exit and hangs the
//  exit code off the error as `code` — catch it, do not re-run the child

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runNode(source) {
  throw new Error('TODO');
}

export async function tryRunNode(source) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with whatever the child printed to stdout', async () => {
  const { stdout } = await runNode("process.stdout.write('hi from the child')");
  eq(stdout, 'hi from the child');
});

test('keeps stderr separate from stdout', async () => {
  const result = await runNode(
    "process.stdout.write('out'); process.stderr.write('err');"
  );
  eq(result.stdout, 'out');
  eq(result.stderr, 'err');
});

test('a non-zero exit rejects instead of resolving', async () => {
  await rejects(() => runNode('process.exit(3)'));
});

test('tryRunNode reports success and the output', async () => {
  eq(await tryRunNode("process.stdout.write('all good')"), {
    ok: true,
    stdout: 'all good',
  });
});

test('tryRunNode reports the exit code instead of throwing', async () => {
  eq(await tryRunNode("process.stderr.write('nope'); process.exit(3);"), {
    ok: false,
    code: 3,
    stderr: 'nope',
  });
});

test('the child really is a separate process', async () => {
  const { stdout } = await runNode('process.stdout.write(String(process.pid))');
  ok(Number(stdout) !== process.pid, 'child pid should differ from ours');
});
