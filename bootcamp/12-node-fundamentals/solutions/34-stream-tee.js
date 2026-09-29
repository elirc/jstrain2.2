// ─────────────────────────────────────────────────────────────────────────
//  34 · tee a stream — SOLUTION                              ★★★ stretch
//  run: node 34-stream-tee.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two PassThrough streams are the branches, and pipe() into
//  both is what buys correctness for free — pipe pauses the source as
//  soon as EITHER destination's buffer is full and resumes when it
//  drains, so the slow branch throttles the fast one instead of dropping
//  data. The hand-rolled `source.on('data', c => { a.write(c); b.write(c) })`
//  looks equivalent, ignores the `false` that write() returns, and grows
//  the whole upload in memory behind the slow consumer.
//  pipe also forwards 'end' to both branches, which is why nothing here
//  calls .end() by hand.
//  What pipe does NOT forward is 'error' — by design, since a destination
//  might be shared. So the explicit source.on('error') destroys both
//  branches with the same error; without it, a failed upload leaves both
//  awaits pending forever, and a hang is much harder to debug than a
//  rejection.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { PassThrough, Readable } from 'node:stream';

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
  const left = new PassThrough();
  const right = new PassThrough();

  source.pipe(left);
  source.pipe(right);
  source.on('error', (error) => {
    left.destroy(error);
    right.destroy(error);
  });

  return [left, right];
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
