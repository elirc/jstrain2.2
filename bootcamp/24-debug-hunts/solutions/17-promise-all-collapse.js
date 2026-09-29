// ─────────────────────────────────────────────────────────────────────────
//  17 · one bad feed takes the board down — SOLUTION            ★★☆ core
//  concepts: bug hunt · Promise.all · partial failure
//  run: node 17-promise-all-collapse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: Promise.all collapse. `Promise.all` is all-or-nothing — the
//  FIRST rejection rejects the whole thing, and the healthy results that
//  were already settled are thrown away with it.
//  The tell: the spec says "teams that fail render an error tile", but
//  the code has no failure branch at all — every payload is stamped
//  `ok: true`. A function that can only build success tiles cannot be
//  implementing that spec.
//  The minimal fix: `Promise.allSettled`, which never rejects, then map
//  each outcome by its `status`. (Equivalent: keep `all` but give every
//  mapped promise its own `.catch` that returns the error tile.)
//  In the wild: one slow-to-fail dependency blanking a whole page,
//  `await Promise.all(users.map(save))` losing every save because one
//  row was invalid. Reach for `all` only when partial success is useless.

import { test, eq, ok, sleep } from '../../_lib/check.js';

export async function fetchBoard(teamIds, fetchTeam) {
  const outcomes = await Promise.allSettled(teamIds.map((id) => fetchTeam(id)));
  return outcomes.map((outcome, i) =>
    outcome.status === 'fulfilled'
      ? { team: teamIds[i], ok: true, data: outcome.value }
      : { team: teamIds[i], ok: false, error: outcome.reason.message }
  );
}

// ── a fake feed: deterministic latencies, `bad` teams reject ─────────────
function makeFeed(bad = []) {
  const latency = { infra: 12, web: 4, ads: 8, payments: 1 };
  return async (id) => {
    await sleep(latency[id] ?? 2);
    if (bad.includes(id)) throw new Error('feed unreachable');
    return { team: id, deploys: id.length };
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('all feeds healthy: one ok tile per team, in input order', async () => {
  const board = await fetchBoard(['infra', 'web', 'ads'], makeFeed());
  eq(board.map((t) => t.team), ['infra', 'web', 'ads']);
  eq(board.map((t) => t.ok), [true, true, true]);
  eq(board[1].data, { team: 'web', deploys: 3 });
});

test('one broken feed: the board still resolves with every team', async () => {
  const board = await fetchBoard(
    ['infra', 'payments', 'web'],
    makeFeed(['payments'])
  );
  eq(board.length, 3);
  eq(board.map((t) => t.team), ['infra', 'payments', 'web']);
});

test('the broken team carries ok:false and the error message', async () => {
  const board = await fetchBoard(
    ['infra', 'payments'],
    makeFeed(['payments'])
  );
  eq(board[0].ok, true);
  eq(board[1], { team: 'payments', ok: false, error: 'feed unreachable' });
});

test('even every feed failing cannot reject the board', async () => {
  const board = await fetchBoard(
    ['ads', 'web'],
    makeFeed(['ads', 'web'])
  );
  eq(board.map((t) => t.ok), [false, false]);
  ok(board.every((t) => t.error === 'feed unreachable'));
});
