// ─────────────────────────────────────────────────────────────────────────
//  04 · boundary guards — SOLUTION                          ★★☆ core
//  run: node ../run.js solutions/04-boundary-guards.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `JSON.parse` returns `any`, which is a lie that spreads.
//  Step one is to catch it in an `unknown` — now nothing compiles until
//  you have proved something, which is the point.
//
//  A guard is a normal function returning `boolean`, annotated `v is T`.
//  The annotation is a promise tsc cannot check, so the body has to earn
//  it field by field: `isRecord` first (typeof null is 'object', and an
//  array is an object too), then one `typeof` per field, then the literal
//  union by comparison, then arrays with `.every(isOrderItem)`.
//
//  Note what each broken fixture costs you if you skip a check: a numeric
//  id sails through `'id' in value`; a missing email sails through
//  anything but `typeof === 'string'`; 'PAID' sails through
//  `typeof status === 'string'`; an item with no qty sails through
//  `Array.isArray(items)` alone. Guards are only as strong as their
//  weakest field.
//
//  `parseWith` factors the shared shape: try/catch around JSON.parse (a
//  parse failure is data, not an exception, at a boundary), then the
//  guard, then the Result. The generic threads T from the guard's
//  predicate straight into `Parsed<T>` — no cast anywhere in the file.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface OrderItem {
  sku: string;
  qty: number;
}

export interface Order {
  id: string;
  total: number;
  items: OrderItem[];
  status: 'new' | 'paid' | 'shipped';
}

export const FIXTURES = {
  user: '{"id":"u_1","name":"Ada","email":"ada@lovelace.dev","active":true}',
  userNumericId: '{"id":7,"name":"Ada","email":"a@b.c","active":true}',
  userNoEmail: '{"id":"u_2","name":"Bo","active":false}',
  order: '{"id":"o_1","total":1999,"items":[{"sku":"a1","qty":2}],"status":"paid"}',
  orderShoutyStatus: '{"id":"o_2","total":10,"items":[],"status":"PAID"}',
  orderItemNoQty: '{"id":"o_3","total":10,"items":[{"sku":"a1"}],"status":"new"}',
  notAnObject: '[1,2,3]',
  brokenJson: '{"id":"o_4",',
};

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.active === 'boolean'
  );
}

export function isOrderItem(value: unknown): value is OrderItem {
  return (
    isRecord(value) &&
    typeof value.sku === 'string' &&
    typeof value.qty === 'number'
  );
}

export function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.total === 'number' &&
    Array.isArray(value.items) &&
    value.items.every(isOrderItem) &&
    (value.status === 'new' ||
      value.status === 'paid' ||
      value.status === 'shipped')
  );
}

function parseWith<T>(
  json: string,
  guard: (value: unknown) => value is T,
  label: string
): Parsed<T> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'invalid json' };
  }
  return guard(data)
    ? { ok: true, value: data }
    : { ok: false, error: `not ${label}` };
}

export function parseUser(json: string): Parsed<User> {
  return parseWith(json, isUser, 'a user');
}

export function parseOrder(json: string): Parsed<Order> {
  return parseWith(json, isOrder, 'an order');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a clean payload parses into a typed value', () => {
  const result = parseUser(FIXTURES.user);
  if (!result.ok) throw new Error('expected the ok branch');
  eq(result.value, {
    id: 'u_1',
    name: 'Ada',
    email: 'ada@lovelace.dev',
    active: true,
  });
});

test('isUser rejects the two broken user fixtures', () => {
  ok(!isUser(JSON.parse(FIXTURES.userNumericId)), 'numeric id must fail');
  ok(!isUser(JSON.parse(FIXTURES.userNoEmail)), 'missing email must fail');
});

test('isUser rejects things that are not plain objects', () => {
  ok(!isUser(JSON.parse(FIXTURES.notAnObject)));
  ok(!isUser(null));
  ok(!isUser('u_1'));
});

test('a clean order parses, items and all', () => {
  const result = parseOrder(FIXTURES.order);
  if (!result.ok) throw new Error('expected the ok branch');
  eq(result.value.items, [{ sku: 'a1', qty: 2 }]);
  eq(result.value.status, 'paid');
});

test('isOrder rejects a status outside the union and a half-built item', () => {
  ok(!isOrder(JSON.parse(FIXTURES.orderShoutyStatus)), 'PAID is not paid');
  ok(!isOrder(JSON.parse(FIXTURES.orderItemNoQty)), 'item needs a qty');
});

test('unparseable text comes back as data, never as an exception', () => {
  eq(parseOrder(FIXTURES.brokenJson), { ok: false, error: 'invalid json' });
  eq(parseUser(FIXTURES.userNoEmail), { ok: false, error: 'not a user' });
  eq(parseOrder(FIXTURES.orderShoutyStatus), {
    ok: false,
    error: 'not an order',
  });
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<Parsed<User>, { ok: true; value: User } | { ok: false; error: string }>
>;
type _t2 = Expect<Equal<ReturnType<typeof parseUser>, Parsed<User>>>;
type _t3 = Expect<Equal<ReturnType<typeof parseOrder>, Parsed<Order>>>;

function _typeTests() {
  const raw: unknown = JSON.parse(FIXTURES.user);

  // @ts-expect-error — raw is unknown until a guard has spoken
  raw.email;

  if (isUser(raw)) {
    const email: string = raw.email;
    use(email);

    // @ts-expect-error — User has no role field
    raw.role;
  }

  const result = parseUser(FIXTURES.user);

  // @ts-expect-error — value exists only on the ok branch
  result.value;

  if (result.ok) {
    const user: User = result.value;
    use(user);
  } else {
    const message: string = result.error;
    use(message);
  }

  const order = parseOrder(FIXTURES.order);
  if (order.ok) {
    // @ts-expect-error — status is a three-way literal union
    const status: 'paid' = order.value.status;
    use(status);
  }

  // @ts-expect-error — parse takes the raw text, not an already-parsed object
  parseUser({ id: 'u_1', name: 'Ada', email: 'a@b.c', active: true });
}
use(_typeTests);
