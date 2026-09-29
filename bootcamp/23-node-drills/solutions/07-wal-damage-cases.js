// ─────────────────────────────────────────────────────────────────────────
//  07 · recovering from three damaged logs — SOLUTION       ★★★ stretch
//  run: node 07-wal-damage-cases.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three different damages, three different defences, and
//  each one is a line of code you would never write without having been
//  bitten.
//  Torn tail — `lines.pop()` unconditionally. split('\n') always yields
//  one more piece than there are complete lines: '' after a clean append,
//  the half-record after a crash. Dropping that piece is what makes the
//  newline a commit marker instead of a formatting habit.
//  Duplicate — the `seq > lastSeq` gate. This is why the `add` op is in
//  the fixture and `set` is not: a duplicated `set` is invisible, a
//  duplicated `add` silently doubles a balance. Idempotent replay is not
//  "my ops happen to be idempotent", it is a sequence number you check.
//  Out of order — the same gate, for free. A writer that rewound is
//  re-emitting work the log already contains; applying it would undo a
//  later state. Note the asymmetry: a seq that jumps FORWARD (4 after 2)
//  is accepted, because a gap means a record was lost, not that this one
//  is stale. Refusing gaps too would be a stricter, defensible policy —
//  the point is that you chose one on purpose.
//  Corruption — `break`, never `continue`. Skipping a bad record and
//  applying the ones after it rebuilds a state that never existed at any
//  moment in time, which is worse than losing the tail: it is wrong data
//  that looks fine.
//  Real WALs do all of this with a CRC per record, so a torn record is
//  detected rather than inferred. Everything above is the poor man's
//  version, and it is what your own append-only files need.

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

function applyOp(state, record) {
  if (record.op === 'set') state[record.key] = record.value;
  else if (record.op === 'del') delete state[record.key];
  else if (record.op === 'add') {
    state[record.key] = (state[record.key] ?? 0) + record.by;
  } else throw new Error(`unknown log op: ${record.op}`);
}

export function loadState(text) {
  const lines = text.split('\n');
  lines.pop(); // '' after a clean append, or the torn record after a crash

  const state = {};
  let lastSeq = 0;
  let skipped = 0;

  for (const line of lines) {
    if (line.trim() === '') continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      break; // corruption: nothing after this point is trustworthy
    }
    if (record.seq <= lastSeq) {
      skipped += 1; // already applied — a duplicate or a rewound writer
      continue;
    }
    applyOp(state, record);
    lastSeq = record.seq;
  }

  return { state, lastSeq, skipped };
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
