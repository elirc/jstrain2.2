// ─────────────────────────────────────────────────────────────────────────
//  05 · object shapes — SOLUTION                           ★☆☆ warm-up
//  run: node ../run.js solutions/05-object-shapes.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an object type is a list of members, each with three
//  independent decisions — name, type, and whether it is `?` optional or
//  `readonly`. Get those decisions from the spec, not from the sample
//  data: `email?: string` because a user may never give one, `readonly
//  id` because the database owns it.
//
//  `email?: string` and `email: string | undefined` are NOT the same. The
//  second still forces you to write `email: undefined` at every call
//  site. Optional is what you want for "may be absent".
//
//  Because `email` may be missing, `user.email` is `string | undefined`,
//  and the compiler makes you deal with that — `user.email ? ... : ...`
//  here. Same for the nested address: `user.address?.city ?? 'unknown'`
//  is the whole implementation of cityOf, and it type-checks because `?.`
//  short-circuits to undefined and `??` supplies the fallback.
//
//  `rename` spreads into a fresh object. `readonly` only blocks writing
//  through an existing reference (`user.id = ...`); building a new object
//  with the same id is exactly how immutable updates are supposed to go.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Address = {
  city: string;
  zip?: string;
};

export type User = {
  readonly id: string;
  name: string;
  email?: string;
  address?: Address;
};

export function displayName(user: User): string {
  return user.email ? `${user.name} <${user.email}>` : user.name;
}

export function cityOf(user: User): string {
  return user.address?.city ?? 'unknown';
}

export function rename(user: User, name: string): User {
  return { ...user, name };
}

// ─────────────────────────── runtime tests ───────────────────────────────

const ada: User = { id: 'u1', name: 'Ada', email: 'ada@x.io' };
const grace: User = { id: 'u2', name: 'Grace', address: { city: 'Bath' } };

test('displayName appends the email when there is one', () => {
  eq(displayName(ada), 'Ada <ada@x.io>');
});

test('displayName is just the name when the email is missing', () => {
  eq(displayName(grace), 'Grace');
});

test('cityOf reads the nested address', () => {
  eq(cityOf(grace), 'Bath');
});

test('cityOf falls back when there is no address', () => {
  eq(cityOf(ada), 'unknown');
});

test('rename copies rather than mutates', () => {
  eq(rename(ada, 'Ada L.'), { id: 'u1', name: 'Ada L.', email: 'ada@x.io' });
  eq(ada.name, 'Ada');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<User['name'], string>>;
type _2 = Expect<Equal<User['email'], string | undefined>>;
type _3 = Expect<Equal<Address['zip'], string | undefined>>;
type _4 = Expect<Equal<keyof User, 'id' | 'name' | 'email' | 'address'>>;
type _5 = Expect<Equal<User['address'], Address | undefined>>;

function _typeTests() {
  // both optional keys may be left out entirely
  const minimal: User = { id: 'u1', name: 'Ada' };

  // @ts-expect-error — id is readonly once the object exists
  minimal.id = 'u2';

  // @ts-expect-error — name is required
  const nameless: User = { id: 'u1' };
  use(nameless);

  // @ts-expect-error — email is a string when it is there at all
  const wrong: User = { id: 'u1', name: 'Ada', email: 42 };
  use(wrong);

  // @ts-expect-error — city is required inside an address
  const noCity: User = { id: 'u1', name: 'Ada', address: { zip: 'BA1' } };
  use(noCity);
}
use(_typeTests);
