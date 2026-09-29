// ─────────────────────────────────────────────────────────────────────────
//  17 · one bad feed takes the board down                       ★★☆ core
//  concepts: bug hunt · Promise.all · partial failure
//  run: node 17-promise-all-collapse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The status board fetches one dashboard per team, in parallel, and is
//  supposed to survive a broken feed: teams that answer render normally,
//  teams that fail render an error tile. Per team, in input order:
//
//      { team: 'infra', ok: true,  data: {...} }
//      { team: 'ads',   ok: false, error: 'feed unreachable' }
//
//  Since the payments feed started flapping, the WHOLE board goes blank —
//  every team, including the healthy ones.
//
//  The code below is fully written — and wrong. 3 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: don't read the happy path first. Reproduce the complaint — run
//  the one failing feed test and look at HOW it fails, not just that it
//  does. What kind of result did the board produce: wrong data, or no
//  data at all?

import { test, eq, ok, sleep } from '../../_lib/check.js';

export async function fetchBoard(teamIds, fetchTeam) {
  const payloads = await Promise.all(teamIds.map((id) => fetchTeam(id)));
  return payloads.map((data, i) => ({ team: teamIds[i], ok: true, data }));
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
