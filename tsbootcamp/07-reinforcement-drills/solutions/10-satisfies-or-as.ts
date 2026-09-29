// ─────────────────────────────────────────────────────────────────────────
//  10 · satisfies or as — SOLUTION                          ★★★ stretch
//  run: node ../run.js solutions/10-satisfies-or-as.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: four tools, four different jobs.
//
//    annotation  checks the value AND flattens it to the annotation.
//                Use when you WANT the wide type: a `let` that will be
//                reassigned, a map callers will add keys to.
//    satisfies   checks the value and keeps the inferred type. Use for
//                config maps where `keyof typeof` must stay precise. It
//                also contextually types the members, which is what stops
//                `req` from being an implicit any.
//    as const    keeps every literal literal and makes it all readonly.
//                Use when the VALUES have to survive into the type.
//    as          claims a type tsc cannot verify. Use only where data
//                enters the process — the output of JSON.parse and
//                nothing else, ideally with a guard next to it.
//
//  The two combinations are worth memorising:
//    · `as const satisfies T` — literal AND checked. Order matters; write
//      the assertion first, the check second.
//    · An annotation plus `as const` is a contradiction: the annotation
//      wins and you lose the literals you just asked for.
//
//  Why `satisfies` on ROUTES rather than `Record<string, Handler>`: with
//  the annotation, `keyof typeof ROUTES` is `string`, so a route union
//  derived from it is useless and `ROUTES['/nope']` compiles.
//
//  Why `as` on PARSED_ENV: the source is `unknown`, and neither an
//  annotation nor `satisfies` will take it — both would have to prove
//  something they cannot. `as` is the honest "I checked this by hand".
//
//  One gotcha you meet here: LOG_LEVEL has no Expect<Equal> pin, because
//  `typeof` on a `let` reports the NARROWED type at that point in the
//  file — 'info', not LogLevel. It is graded instead by the two
//  assignments in _typeTests, which is the sharper test anyway: with no
//  annotation `= 'shout'` compiles, and with `as const` `= 'debug'` does
//  not. Only the annotation passes both.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Req {
  url: string;
}

export type Handler = (req: Req) => string;
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface EnvConfig {
  host: string;
  port: number;
  tls: boolean;
}

const RAW_ENV: unknown = JSON.parse(
  '{"host":"localhost","port":5432,"tls":false}'
);

// 1 · keys stay literal, handlers checked against Handler
export const ROUTES = {
  '/health': () => 'ok',
  '/users': (req) => `users for ${req.url}`,
} satisfies Record<string, Handler>;

// 2 · the numbers themselves must survive into the type
export const RETRY_LIMITS = { api: 3, db: 5, cache: 1 } as const;

// 3 · deliberately wide: this one gets reassigned at runtime
export let LOG_LEVEL: LogLevel = 'info';

// 4 · it came from JSON.parse as unknown; we claim the shape
export const PARSED_ENV = RAW_ENV as EnvConfig;

// 5 · deliberately wide: callers add their own headers
export const DEFAULT_HEADERS: Record<string, string> = {
  'content-type': 'application/json',
  accept: 'application/json',
};

// 6 · literal AND checked against the schema
export const TIMEOUTS = {
  connect: 1000,
  read: 5000,
  write: 2000,
} as const satisfies Record<string, number>;

// ─────────────────────────── runtime tests ───────────────────────────────

test('the route table dispatches', () => {
  eq(ROUTES['/health'](), 'ok');
  eq(ROUTES['/users']({ url: '/users?page=2' }), 'users for /users?page=2');
});

test('the lookup tables read as plain numbers', () => {
  eq(RETRY_LIMITS.api, 3);
  eq(TIMEOUTS.read, 5000);
  eq(Object.keys(TIMEOUTS), ['connect', 'read', 'write']);
});

test('headers are a widened map callers can extend', () => {
  const merged: Record<string, string> = {
    ...DEFAULT_HEADERS,
    'x-trace': 'abc',
  };
  eq(merged['content-type'], 'application/json');
  eq(merged['x-trace'], 'abc');
});

test('the claimed env config carries the parsed values', () => {
  eq(PARSED_ENV.host, 'localhost');
  eq(PARSED_ENV.port, 5432);
  ok(PARSED_ENV.tls === false);
});

test('the log level starts at info', () => {
  eq(LOG_LEVEL, 'info');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _c1 = Expect<
  Equal<
    typeof ROUTES,
    { '/health': () => string; '/users': (req: Req) => string }
  >
>;
type _c2 = Expect<
  Equal<typeof RETRY_LIMITS, { readonly api: 3; readonly db: 5; readonly cache: 1 }>
>;
type _c4 = Expect<Equal<typeof PARSED_ENV, EnvConfig>>;
type _c5 = Expect<Equal<typeof DEFAULT_HEADERS, Record<string, string>>>;
type _c6 = Expect<
  Equal<
    typeof TIMEOUTS,
    { readonly connect: 1000; readonly read: 5000; readonly write: 2000 }
  >
>;
type _c7 = Expect<Equal<keyof typeof ROUTES, '/health' | '/users'>>;

function _typeTests() {
  const body: string = ROUTES['/health']();
  use(body);

  // @ts-expect-error — the route keys stayed literal, and this is not one
  ROUTES['/nope'];

  const three: 3 = RETRY_LIMITS.api;
  use(three);

  // @ts-expect-error — as const froze it
  RETRY_LIMITS.api = 4;

  LOG_LEVEL = 'debug';

  // @ts-expect-error — 'shout' is not a log level
  LOG_LEVEL = 'shout';

  DEFAULT_HEADERS['x-trace'] = 'abc';

  const env: EnvConfig = PARSED_ENV;
  use(env);

  // @ts-expect-error — the claim was EnvConfig, which has no `user`
  PARSED_ENV.user;

  // @ts-expect-error — as const means readonly here too
  TIMEOUTS.connect = 1;

  const ms: 5000 = TIMEOUTS.read;
  use(ms);
}
use(_typeTests);
