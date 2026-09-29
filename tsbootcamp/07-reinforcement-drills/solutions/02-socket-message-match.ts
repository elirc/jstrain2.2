// ─────────────────────────────────────────────────────────────────────────
//  02 · socket message match — SOLUTION                     ★★★ stretch
//  run: node ../run.js solutions/02-socket-message-match.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Handlers<R>` is a mapped type over the discriminant union
//  `SocketMessage['kind']`. For each key K it pulls the ONE member that
//  carries that kind with `Extract<SocketMessage, { kind: K }>` — so the
//  `data` handler is typed to see `payload`/`seq` and nothing else. That
//  pairing of a mapped type with an indexed lookup is the whole pattern;
//  it is also why a missing key is a compile error (a mapped type has no
//  optional members unless you ask for them) and an extra key is one too.
//
//  Inside `match`, `handlers[msg.kind]` types as a UNION of four functions,
//  and calling a union of functions demands an argument assignable to every
//  parameter — i.e. their intersection, which is impossible here. tsc is
//  right to complain: it cannot see that the key and the message came from
//  the same object. One narrow, named `as` at that single line is the
//  honest fix, and it is the only unsound step in the file.
//
//  Wrong turn: `Record<MessageKind, (msg: SocketMessage) => R>`. Every
//  handler then re-narrows the message it was just routed by.

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type SocketMessage =
  | { kind: 'open'; url: string }
  | { kind: 'data'; payload: string; seq: number }
  | { kind: 'error'; code: number; reason: string }
  | { kind: 'close'; clean: boolean };

export type MessageKind = SocketMessage['kind'];

export type Handlers<R> = {
  [K in MessageKind]: (msg: Extract<SocketMessage, { kind: K }>) => R;
};

export function match<R>(msg: SocketMessage, handlers: Handlers<R>): R {
  const handler = handlers[msg.kind] as (m: SocketMessage) => R;
  return handler(msg);
}

export const toLine: Handlers<string> = {
  open: (msg) => `open ${msg.url}`,
  data: (msg) => `data #${msg.seq} (${msg.payload.length}b)`,
  error: (msg) => `error ${msg.code}: ${msg.reason}`,
  close: (msg) => (msg.clean ? 'closed cleanly' : 'closed abruptly'),
};

export function logLine(msg: SocketMessage): string {
  return match(msg, toLine);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('every kind routes to its own handler', () => {
  eq(logLine({ kind: 'open', url: 'wss://api.test/s' }), 'open wss://api.test/s');
  eq(logLine({ kind: 'data', payload: 'hello', seq: 3 }), 'data #3 (5b)');
  eq(logLine({ kind: 'error', code: 1006, reason: 'lost' }), 'error 1006: lost');
  eq(logLine({ kind: 'close', clean: true }), 'closed cleanly');
});

test('the close handler reads its own boolean payload', () => {
  eq(logLine({ kind: 'close', clean: false }), 'closed abruptly');
});

test('match returns whatever the handlers return', () => {
  const weight: Handlers<number> = {
    open: () => 0,
    data: (msg) => msg.seq,
    error: (msg) => msg.code,
    close: (msg) => (msg.clean ? 1 : 0),
  };
  eq(match({ kind: 'data', payload: 'x', seq: 7 }, weight), 7);
  eq(match({ kind: 'error', code: 500, reason: 'x' }, weight), 500);
});

test('exactly one handler runs per message', () => {
  const open = spy(() => 'o');
  const data = spy(() => 'd');
  const counted: Handlers<string> = {
    open,
    data,
    error: () => 'e',
    close: () => 'c',
  };
  eq(match({ kind: 'data', payload: 'x', seq: 1 }, counted), 'd');
  eq(open.callCount, 0);
  eq(data.callCount, 1);
});

test('the handler receives the whole message object', () => {
  const seen: unknown[] = [];
  const spyMap: Handlers<void> = {
    open: (msg) => void seen.push(msg),
    data: (msg) => void seen.push(msg),
    error: (msg) => void seen.push(msg),
    close: (msg) => void seen.push(msg),
  };
  match({ kind: 'open', url: 'wss://x' }, spyMap);
  eq(seen, [{ kind: 'open', url: 'wss://x' }]);
  ok(seen.length === 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<MessageKind, 'open' | 'data' | 'error' | 'close'>>;
type _t2 = Expect<
  Equal<
    Parameters<Handlers<string>['data']>[0],
    { kind: 'data'; payload: string; seq: number }
  >
>;
type _t3 = Expect<Equal<keyof Handlers<string>, MessageKind>>;
type _t4 = Expect<Equal<ReturnType<typeof match<number>>, number>>;

function _typeTests() {
  const line: string = logLine({ kind: 'close', clean: true });
  use(line);

  const typed: Handlers<number> = {
    open: (msg) => msg.url.length,
    // @ts-expect-error — a data message carries no `code`
    data: (msg) => msg.code,
    error: (msg) => msg.code,
    close: (msg) => (msg.clean ? 1 : 0),
  };
  use(typed);

  // @ts-expect-error — every kind needs a handler, and close is missing
  const partial: Handlers<string> = { open: () => 'o', data: () => 'd', error: () => 'e' };
  use(partial);

  const extra: Handlers<string> = {
    open: () => 'o',
    data: () => 'd',
    error: () => 'e',
    close: () => 'c',
    // @ts-expect-error — 'ping' is not a message kind
    ping: () => 'p',
  };
  use(extra);

  // @ts-expect-error — the handler map is not optional
  match({ kind: 'close', clean: true });
}
use(_typeTests);
