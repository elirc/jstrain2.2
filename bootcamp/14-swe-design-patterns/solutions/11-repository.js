// ─────────────────────────────────────────────────────────────────────────
//  11 · UserRepository — SOLUTION                               ★★☆ core
//  concepts: repository · persistence boundary · defensive copies
//  run: node solutions/11-repository.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — give storage one narrow interface (add/get/find/update/
//  delete) so the rest of the app talks about *users*, not about rows.
//  The service is the proof: it enforces "no duplicate email" using only
//  `find` and `add`, so the same service runs against this Map today and
//  a Postgres repository tomorrow — and its unit tests never need a
//  database at all.
//  The copies matter. Handing out live internal objects means a caller
//  can "save" by mutating, which silently works in memory and silently
//  fails the day the repository is real.
//  When NOT to use: over a query-rich domain, a repository that grows
//  `findByNameAndCityOrderedByAge` per screen is worse than just writing
//  SQL. Repositories fit entity access, not reporting.
//  In the wild: Spring Data, TypeORM/Prisma repositories, the DAO layer
//  in most Node services, and `localStorage` wrappers on the front end.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createUserRepository() {
  const rows = new Map();
  let nextId = 1;
  const copy = (user) => (user ? { ...user } : undefined);

  return {
    add(user) {
      const stored = { id: `u${nextId++}`, ...user };
      rows.set(stored.id, stored);
      return copy(stored);
    },
    getById(id) {
      return copy(rows.get(id));
    },
    find(predicate) {
      return [...rows.values()].map((user) => copy(user)).filter(predicate);
    },
    update(id, patch) {
      const current = rows.get(id);
      if (!current) return undefined;
      const next = { ...current, ...patch, id };
      rows.set(id, next);
      return copy(next);
    },
    delete(id) {
      return rows.delete(id);
    },
    count() {
      return rows.size;
    },
  };
}

export function createUserService(repo) {
  return {
    register(name, email) {
      const taken = repo.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (taken.length > 0) {
        throw new Error(`email already registered: ${email}`);
      }
      return repo.add({ name, email });
    },
    rename(id, name) {
      const updated = repo.update(id, { name });
      if (!updated) throw new Error(`no such user: ${id}`);
      return updated;
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('add stores the user and assigns a sequential id', () => {
  const repo = createUserRepository();
  eq(repo.add({ name: 'Ada', email: 'ada@x.io' }), {
    id: 'u1',
    name: 'Ada',
    email: 'ada@x.io',
  });
  eq(repo.add({ name: 'Grace', email: 'grace@x.io' }).id, 'u2');
  eq(repo.count(), 2);
});

test('getById finds a user, or returns undefined', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  eq(repo.getById('u1').name, 'Ada');
  eq(repo.getById('nope'), undefined);
});

test('the repository hands out copies, not its own objects', () => {
  const repo = createUserRepository();
  const added = repo.add({ name: 'Ada', email: 'ada@x.io' });
  added.name = 'HACKED';
  const fetched = repo.getById('u1');
  fetched.name = 'ALSO HACKED';
  eq(repo.getById('u1').name, 'Ada');
});

test('find filters with a predicate', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  repo.add({ name: 'Grace', email: 'grace@x.io' });
  eq(repo.find((u) => u.name.startsWith('A')).map((u) => u.id), ['u1']);
  eq(repo.find(() => true).length, 2);
  eq(repo.find(() => false), []);
});

test('update merges a patch and leaves the rest alone', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  eq(repo.update('u1', { name: 'Ada L.' }), {
    id: 'u1',
    name: 'Ada L.',
    email: 'ada@x.io',
  });
  eq(repo.getById('u1').name, 'Ada L.');
  eq(repo.update('ghost', { name: 'x' }), undefined);
});

test('delete removes and reports whether it did', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  eq(repo.delete('u1'), true);
  eq(repo.delete('u1'), false);
  eq(repo.getById('u1'), undefined);
  eq(repo.count(), 0);
});

test('the service registers users through the repository', () => {
  const repo = createUserRepository();
  const service = createUserService(repo);
  const user = service.register('Ada', 'ada@x.io');
  eq(user.id, 'u1');
  eq(repo.count(), 1);
  eq(service.rename('u1', 'Ada L.').name, 'Ada L.');
});

test('the service enforces rules the repository knows nothing about', () => {
  const service = createUserService(createUserRepository());
  service.register('Ada', 'ada@x.io');
  throws(() => service.register('Imposter', 'ADA@X.IO'), 'email already registered');
  throws(() => service.rename('ghost', 'x'), 'no such user: ghost');
  ok(true);
});
