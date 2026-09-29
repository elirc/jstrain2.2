// ─────────────────────────────────────────────────────────────────────────
//  04 · fluent builder — SOLUTION                               ★★☆ core
//  run: node 04-fluent-builder.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one recursive maker function, `make(values)`, is the whole
//  design. Every setter closes over the values it was given and calls
//  `make` again with a copy — so a builder is a value, not a machine with
//  state, and you can hand the same base builder to ten tests without any
//  of them contaminating the others.
//  The setters are generated in a loop from the default KEYS, which is why
//  `withNope` does not exist: the builder's surface is derived from the
//  shape, so a typo is a TypeError in your face instead of a silently
//  ignored field.
//  `build()` spreads once more, so the object handed to the test is not the
//  builder's internal state either. The classic wrong turn is a mutable
//  builder (`this.values[key] = value; return this`) — it reads the same at
//  the call site and then one shared `aUser` leaks a role from test 3 into
//  test 9.

import { test, eq, ok } from '../../_lib/check.js';

export function builder(defaults) {
  const keys = Object.keys(defaults);

  const make = (values) => {
    const b = {
      build: () => ({ ...values }),
      with: (patch) => make({ ...values, ...patch }),
    };
    for (const key of keys) {
      const setter = `with${key[0].toUpperCase()}${key.slice(1)}`;
      b[setter] = (value) => make({ ...values, [key]: value });
    }
    return b;
  };

  return () => make({ ...defaults });
}

// ──────────────────────────── tests ──────────────────────────────────────

const DEFAULTS = { name: 'Ada', role: 'viewer', teamId: 7 };

test('build() returns the defaults', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().build(), { name: 'Ada', role: 'viewer', teamId: 7 });
});

test('there is one setter per default key, and no others', () => {
  const aUser = builder(DEFAULTS);
  const b = aUser();
  eq(typeof b.withName, 'function');
  eq(typeof b.withRole, 'function');
  eq(typeof b.withTeamId, 'function');
  eq(b.withNope, undefined);
});

test('a setter sets its field and leaves the rest alone', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().withName('Bo').build(), {
    name: 'Bo',
    role: 'viewer',
    teamId: 7,
  });
});

test('setters chain', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().withName('Bo').withRole('admin').withTeamId(1).build(), {
    name: 'Bo',
    role: 'admin',
    teamId: 1,
  });
});

test('with(patch) applies several keys at once', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().with({ role: 'admin', teamId: 2 }).build(), {
    name: 'Ada',
    role: 'admin',
    teamId: 2,
  });
});

test('every setter returns a NEW builder — the base is untouched', () => {
  const aUser = builder(DEFAULTS);
  const base = aUser();
  const admin = base.withRole('admin');
  ok(admin !== base, 'a setter must not return the same builder');
  eq(admin.build().role, 'admin');
  eq(base.build().role, 'viewer');
});

test('build() hands out a fresh object every time', () => {
  const aUser = builder(DEFAULTS);
  const b = aUser();
  const first = b.build();
  first.name = 'Mutated';
  eq(b.build().name, 'Ada');
});

test('the defaults object itself is never modified', () => {
  const defaults = { name: 'Ada', role: 'viewer', teamId: 7 };
  const aUser = builder(defaults);
  aUser().withName('Bo').withRole('admin').build();
  eq(defaults, { name: 'Ada', role: 'viewer', teamId: 7 });
});
