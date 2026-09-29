// ─────────────────────────────────────────────────────────────────────────
//  10 · satisfies or as                                     ★★★ stretch
//  concepts: satisfies · as const · as · annotations
//  run: node ../run.js exercises/10-satisfies-or-as.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-01, TS-02 and TS-06.
//
//  Six declarations, six goals. Replace each `: TODO` with the right tool
//  — an annotation, `satisfies`, `as const`, `as`, or a combination. The
//  values themselves are already correct; only the typing is missing.
//
//    1 ROUTES          route keys stay literal, handlers checked
//    2 RETRY_LIMITS    the numbers survive into the type
//    3 LOG_LEVEL       deliberately wide: it is reassigned later
//    4 PARSED_ENV      came from JSON.parse as unknown; claim the shape
//    5 DEFAULT_HEADERS deliberately wide: callers add their own keys
//    6 TIMEOUTS        literal AND checked against Record<string, number>
//
//  The runtime tests pass from the first run. tsc is the whole todo list.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with the right tool

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
export const ROUTES: TODO = {
  '/health': () => 'ok',
  '/users': (req) => `users for ${req.url}`,
};

// 2 · the numbers themselves must survive into the type
export const RETRY_LIMITS: TODO = { api: 3, db: 5, cache: 1 };

// 3 · deliberately wide: this one gets reassigned at runtime
export let LOG_LEVEL: TODO = 'info';

// 4 · it came from JSON.parse as unknown; we claim the shape
export const PARSED_ENV: TODO = RAW_ENV;

// 5 · deliberately wide: callers add their own headers
export const DEFAULT_HEADERS: TODO = {
  'content-type': 'application/json',
  accept: 'application/json',
};

// 6 · literal AND checked against the schema
export const TIMEOUTS: TODO = {
  connect: 1000,
  read: 5000,
  write: 2000,
};

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
