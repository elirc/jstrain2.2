// ─────────────────────────────────────────────────────────────────────────
//  34 · tee a stream                                         ★★★ stretch
//  concepts: PassThrough · pipe · backpressure · error propagation
//  run: node 34-stream-tee.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You are streaming an upload and you need it twice: once to write to
//  disk, once to hash it. You cannot read a stream twice, so you split
//  it — the shell writes this as `tee`.
//
//      const [left, right] = tee(source);
//      const [saved, digest] = await Promise.all([save(left), hash(right)]);
//
//  Both branches must see every byte, in order, and both must end when
//  the source ends. Two things make this ★★★: a slow consumer on one
//  branch must not make the other branch lose data (the source has to
//  wait — that is backpressure), and an error on the source has to reach
//  BOTH branches, or an await downstream hangs forever.
//
//  hint: PassThrough is a Transform that copies its input, which makes it
//  the obvious branch. `source.pipe(a)` handles the flowing and the
//  backpressure for you — but read the docs on what pipe does with an
//  'error' on the source. (It does nothing. That part is yours.)

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { Readable } from 'node:stream';

// Provided: drain a stream into one Buffer — optionally pausing between
// chunks, so one branch can be made deliberately slow.
async function collect(stream, delayMs = 0) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
    if (delayMs) await sleep(delayMs);
  }
  return Buffer.concat(chunks);
}

export function tee(source) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('both branches receive the whole payload', async () => {
  const [left, right] = tee(Readable.from(['alpha ', 'beta ', 'gamma']));
  const [a, b] = await Promise.all([collect(left), collect(right)]);
  eq(a.toString('utf8'), 'alpha beta gamma');
  eq(b.toString('utf8'), 'alpha beta gamma');
});

test('the branches are two separate readable streams', async () => {
  const [left, right] = tee(Readable.from(['x']));
  ok(left instanceof Readable);
  ok(right instanceof Readable);
  ok(left !== right, 'handing back the same stream twice is not a tee');
  await Promise.all([collect(left), collect(right)]);
});

test('an empty source gives two empty branches', async () => {
  const [left, right] = tee(Readable.from([]));
  const [a, b] = await Promise.all([collect(left), collect(right)]);
  eq(a.length, 0);
  eq(b.length, 0);
});

test('bytes are copied, not decoded', async () => {
  const bytes = Buffer.from('héllo 👋 wörld', 'utf8');
  const source = Readable.from([bytes.subarray(0, 9), bytes.subarray(9)]);
  const [left, right] = tee(source);
  const [a, b] = await Promise.all([collect(left), collect(right)]);
  eq(a.equals(bytes), true);
  eq(b.equals(bytes), true);
});

test('a slow reader on one branch still gets everything', async () => {
  const chunks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const [left, right] = tee(Readable.from(chunks));
  const [slow, fast] = await Promise.all([collect(left, 2), collect(right)]);
  eq(slow.toString('utf8'), '12345678');
  eq(fast.toString('utf8'), '12345678');
});

test('an error on the source reaches both branches', async () => {
  const source = new Readable({ read() {} }); // never ends on its own
  const [left, right] = tee(source);
  const a = collect(left);
  const b = collect(right);
  source.destroy(new Error('boom'));
  await rejects(a, 'boom');
  await rejects(b, 'boom');
});
