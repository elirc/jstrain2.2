// ─────────────────────────────────────────────────────────────────────────
//  07 · recovering from three damaged logs                  ★★★ stretch
//  concepts: write-ahead log · replay · torn records · idempotency
//  run: node 07-wal-damage-cases.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 19 had you survive a torn final record. Real logs arrive
//  damaged in more than one way. Below are four of them, verbatim, as the
//  bytes a crashed process left behind.
//
//  Build `loadState(text)` → { state, lastSeq, skipped }
//
//  A record is one line of JSON: { seq, op, key } plus `value` for 'set'
//  and `by` for 'add'.
//
//      set → state[key] = value        del → delete state[key]
//      add → state[key] = (state[key] ?? 0) + by
//
//  The recovery rules:
//    · the newline is the commit marker — an unterminated final line was
//      never committed and is not a record
//    · a line that will not parse ends the replay: everything after it is
//      suspect, and applying it would rebuild a state that never existed
//    · a record is applied only if its seq is greater than the highest
//      seq applied so far; anything else is a replay of work already
//      done. Count those in `skipped`
//    · `lastSeq` is the highest seq applied, 0 for an empty log
//    · an op you do not recognise is a bug: throw `unknown log op: <op>`

import { test, eq, throws } from '../../_lib/check.js';

// Provided fixture 1: a log written by a process that shut down cleanly.
export const CLEAN =
  '{"seq":1,"op":"set","key":"theme","value":"light"}\n' +
  '{"seq":2,"op":"add","key":"hits","by":1}\n' +
  '{"seq":3,"op":"set","key":"theme","value":"dark"}\n' +
  '{"seq":4,"op":"add","key":"hits","by":2}\n';

// Provided fixture 2: the power went out mid-append. Note the missing
// newline — those bytes are half a record.
export const TORN_TAIL =
  '{"seq":1,"op":"set","key":"theme","value":"light"}\n' +
  '{"seq":2,"op":"add","key":"hits","by":1}\n' +
  '{"seq":3,"op":"set","key":"the';

// Provided fixture 3: the writer crashed after the append landed but
// before it recorded the ack, so on restart it appended seq 2 again.
export const DUPLICATE_OP =
  '{"seq":1,"op":"add","key":"hits","by":1}\n' +
  '{"seq":2,"op":"add","key":"hits","by":5}\n' +
  '{"seq":2,"op":"add","key":"hits","by":5}\n' +
  '{"seq":3,"op":"set","key":"theme","value":"dark"}\n';

// Provided fixture 4: a restarted writer rewound its counter and
// re-emitted work that is already in the log, out of order.
export const OUT_OF_ORDER =
  '{"seq":1,"op":"set","key":"theme","value":"light"}\n' +
  '{"seq":2,"op":"add","key":"hits","by":1}\n' +
  '{"seq":4,"op":"set","key":"theme","value":"dark"}\n' +
  '{"seq":3,"op":"add","key":"hits","by":10}\n';

// Provided fixture 5: a bad sector in the middle of the file.
export const CORRUPT_MIDDLE =
  '{"seq":1,"op":"set","key":"theme","value":"light"}\n' +
  '{"seq":2,"op":"add","key":"hi\n' +
  '{"seq":3,"op":"set","key":"theme","value":"dark"}\n';

export function loadState(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a clean log replays to the state the writer meant', () => {
  eq(loadState(CLEAN), {
    state: { theme: 'dark', hits: 3 },
    lastSeq: 4,
    skipped: 0,
  });
});

test('an empty log is an empty state, not a crash', () => {
  eq(loadState(''), { state: {}, lastSeq: 0, skipped: 0 });
});

test('the torn final record costs that write and nothing else', () => {
  eq(loadState(TORN_TAIL), {
    state: { theme: 'light', hits: 1 },
    lastSeq: 2,
    skipped: 0,
  });
});

test('a duplicated append is applied exactly once', () => {
  eq(loadState(DUPLICATE_OP), {
    state: { hits: 6, theme: 'dark' },
    lastSeq: 3,
    skipped: 1,
  });
});

test('a rewound seq is work already done, not new work', () => {
  eq(loadState(OUT_OF_ORDER), {
    state: { theme: 'dark', hits: 1 },
    lastSeq: 4,
    skipped: 1,
  });
});

test('corruption ends the replay — later records are not applied', () => {
  eq(loadState(CORRUPT_MIDDLE), {
    state: { theme: 'light' },
    lastSeq: 1,
    skipped: 0,
  });
});

test('del removes a key, and removing a missing key is fine', () => {
  const log =
    '{"seq":1,"op":"set","key":"a","value":1}\n' +
    '{"seq":2,"op":"del","key":"a"}\n' +
    '{"seq":3,"op":"del","key":"ghost"}\n';
  eq(loadState(log), { state: {}, lastSeq: 3, skipped: 0 });
});

test('an op written by a newer version fails loudly', () => {
  throws(
    () => loadState('{"seq":1,"op":"increment","key":"hits"}\n'),
    'unknown log op: increment'
  );
});
