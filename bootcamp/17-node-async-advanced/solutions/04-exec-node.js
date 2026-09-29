// ─────────────────────────────────────────────────────────────────────────
//  04 · exec a child process — SOLUTION                        ★★☆ core
//  run: node 04-exec-node.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `execFile(file, args)` takes an ARRAY of arguments and
//  never involves a shell, so nothing in `source` can be interpreted as a
//  pipe, a redirect or a second command. That is the whole reason to
//  prefer execFile over exec: exec spawns `/bin/sh -c` (or cmd.exe) and
//  turns any user-supplied string into a command-injection hole.
//  promisify turns the callback into a promise that resolves
//  { stdout, stderr } and rejects on a non-zero exit — with the exit code
//  on `error.code` and the child's output still attached as
//  `error.stdout` / `error.stderr`. tryRunNode is the ergonomic wrapper:
//  catch once, translate into a plain result object, never lose the code.
//  Wrong turn: assuming a rejection means "the child never ran". It very
//  often ran, printed a useful diagnostic, and failed — read error.stderr
//  before you retry anything.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runNode(source) {
  return execFileAsync(process.execPath, ['-e', source]);
}

export async function tryRunNode(source) {
  try {
    const { stdout } = await runNode(source);
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, code: error.code, stderr: error.stderr };
  }
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
