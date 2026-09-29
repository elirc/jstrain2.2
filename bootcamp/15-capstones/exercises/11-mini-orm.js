// ─────────────────────────────────────────────────────────────────────────
//  11 · mini ORM                                            ★★★ capstone
//  concepts: classes · accessors · prepared statements · N+1
//  time: 45–60 min · 4 stages · 25 tests
//  run: node 11-mini-orm.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  ActiveRecord, Prisma, Sequelize, Eloquent — the layer everybody uses
//  and nobody has looked inside. There is no magic in it: a class per
//  table, a getter/setter pair per column, and a small amount of careful
//  string-building around `?` parameters. Build one and two things
//  change for good. You stop being afraid of the ORM, and you start
//  seeing the N+1 query it makes so very easy to write.
//
//  This is the capstone that touches a database. Module 19 gave you
//  DatabaseSync, prepare and run; module 22 gave you the join that kills
//  N+1 in raw SQL. Here the two meet — and the query counter in the
//  tests is the instrument you will use for the rest of your career.
//
//  STAGES — do them in order, run the file after each one
//    1. the record ........ defineModel, new / save / find / all / create
//    2. dirty tracking .... write only what changed; update and delete
//    3. queries ........... where / count, and one statement cache
//    4. relations ★ ....... hasMany, lazy loading, and 2 queries not N+1
//
//  THE SPEC
//
//      const orm  = createOrm(db);
//      const User = orm.defineModel('users', ['name', 'email']);
//      const Post = orm.defineModel('posts', ['user_id','title','views']);
//
//      const u = new User({ name: 'Ada', email: 'ada@x.dev' });
//      u.id                → null      // nothing has been written yet
//      u.save()            → the instance; u.id is now the database's id
//      User.find(1)        → an instance, or null
//      User.all()          → every row, ordered by id
//      User.create({…})    → new + save
//      u.toJSON()          → { id, name, email }
//
//    INSERT only the fields you actually set, so the table's DEFAULTs
//    still apply. Rows come out of node:sqlite with a NULL prototype —
//    `Object.getPrototypeOf(row) === null` — so spread them at the
//    boundary (`{ ...row }`) and never let one loose in your own code.
//
//    stage 2 — the point of an ORM instance:
//
//      u.name = 'Ada L';    u.isDirty() → true
//      u.changes()          → { name: 'Ada L' }
//      u.save()             // UPDATE users SET name = ? WHERE id = ?
//                           // that column ONLY. A clean record must run
//                           // no query at all.
//      u.update({ email })  // assign a patch, then save
//      u.delete()           → true — and saving it afterwards throws
//
//    stage 3 —
//
//      User.where({ user_id: 1, views: 40 })   // AND-ed, values as ?
//      User.count()                            // SELECT COUNT(*)
//
//    find() called five times must PREPARE once and EXECUTE five times.
//
//    stage 4 —
//
//      User.hasMany('posts', { model: Post, foreignKey: 'user_id' });
//      user.posts()                      // lazy: one query, then cached
//      User.all({ include: ['posts'] })  // TWO queries for any N users
//
//  hint (stage 1): `Object.defineProperty(Record.prototype, field, {get,
//  set})` — one pair per field, defined on the prototype, is what turns
//  `user.name = 'Ada'` into a method call that can record itself.
//  hint (stage 4): you cannot bind an array to one `?`. Build
//  `IN (?, ?, ?)` from the COUNT of the ids, run it once, then group the
//  children by foreign key in a Map and push each list into its parent's
//  relation cache — so the lazy accessor finds it already there.

import { test, eq, ok, throws } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// ── scaffolding for the tests — no need to change any of this ────────────

const SCHEMA = `
  CREATE TABLE users (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT
  );
  CREATE TABLE posts (
    id      INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title   TEXT    NOT NULL,
    views   INTEGER NOT NULL DEFAULT 0
  );
`;

// 4 users · 5 posts. Margaret has never posted — that gap is what the
// eager-loading tests are for.
const USERS = [
  [1, 'Ada', 'ada@x.dev'],
  [2, 'Grace', 'grace@x.dev'],
  [3, 'Linus', 'linus@x.dev'],
  [4, 'Margaret', 'margaret@x.dev'],
];
const POSTS = [
  [1, 1, 'Notes on the Analytical Engine', 120],
  [2, 1, 'On Loops', 40],
  [3, 2, 'Finding the Bug', 300],
  [4, 2, 'A Compiler Is Just a Program', 90],
  [5, 3, 'Just for Fun', 500],
];

// Wraps a database so every prepare and every execution is counted, and
// remembers the SQL that actually ran. `counter.reset()` zeroes it.
function counting(real) {
  const counter = {
    queries: 0,
    prepares: 0,
    sql: [],
    reset() {
      counter.queries = 0;
      counter.prepares = 0;
      counter.sql.length = 0;
    },
  };
  const db = {
    prepare(sql) {
      counter.prepares += 1;
      const stmt = real.prepare(sql);
      const track = (fn) => (...args) => {
        counter.queries += 1;
        counter.sql.push(sql);
        return fn(...args);
      };
      return {
        all: track((...a) => stmt.all(...a)),
        get: track((...a) => stmt.get(...a)),
        run: track((...a) => stmt.run(...a)),
      };
    },
  };
  return { db, counter };
}

// Fresh seeded :memory: database + a counting wrapper + your orm.
function withOrm(run) {
  const real = new DatabaseSync(':memory:');
  real.exec(SCHEMA);
  const load = (sql, rows) => {
    const stmt = real.prepare(sql);
    for (const row of rows) stmt.run(...row);
  };
  load('INSERT INTO users VALUES (?, ?, ?)', USERS);
  load('INSERT INTO posts VALUES (?, ?, ?, ?)', POSTS);
  const { db, counter } = counting(real);
  try {
    return run({ orm: createOrm(db), counter, real });
  } finally {
    real.close();
  }
}

// ── your ORM ─────────────────────────────────────────────────────────────

// createOrm(db) → { defineModel(table, fields) }
// `db` is the counting wrapper above: db.prepare(sql) → { all, get, run }.
export function createOrm(db) {
  // stage 3 — every SQL string in this file should come through here, so
  // that a given query is compiled once per connection and reused.
  const prepare = (sql) => {
    throw new Error('TODO');
  };

  function defineModel(table, fields) {
    class Record {
      static table = table;
      static fields = fields;

      // stage 1 — one row, plus bookkeeping: what the values are and
      // which of them the caller has touched since the last save.
      constructor(attrs = {}) {
        throw new Error('TODO');
      }

      // stage 1 — the boundary: a null-prototype row becomes an instance
      // that is NOT dirty (it came from the database; nothing to write).
      static hydrate(row) {
        throw new Error('TODO');
      }

      static find(id) {
        throw new Error('TODO');
      }

      // stage 1 — every row, ordered by id.
      // stage 4 — `include` preloads those relations first.
      static all({ include = [] } = {}) {
        throw new Error('TODO');
      }

      // stage 3 — { col: value, … } → WHERE col = ? AND col = ?
      static where(conditions = {}) {
        throw new Error('TODO');
      }

      // stage 4 — WHERE col IN (?, ?, ?) — one query, many parents.
      static whereIn(column, values) {
        throw new Error('TODO');
      }

      static create(attrs) {
        throw new Error('TODO');
      }

      static count() {
        throw new Error('TODO');
      }

      // stage 4 — remember the relation, and add a lazy accessor method
      // called `name` to the prototype.
      static hasMany(name, { model, foreignKey }) {
        throw new Error('TODO');
      }

      // stage 4 — load `name` for MANY records in one query and fill in
      // their caches, so the lazy accessor never has to fire.
      static preload(records, name) {
        throw new Error('TODO');
      }

      isNew() {
        throw new Error('TODO');
      }

      isDirty() {
        throw new Error('TODO');
      }

      // → { field: newValue } for everything touched since the last save
      changes() {
        throw new Error('TODO');
      }

      toJSON() {
        throw new Error('TODO');
      }

      // stage 1 + 2 — insert, update-what-changed, or do nothing at all.
      save() {
        throw new Error('TODO');
      }

      update(patch) {
        throw new Error('TODO');
      }

      delete() {
        throw new Error('TODO');
      }
    }

    // stage 1 — define one getter/setter pair per field here, on the
    // PROTOTYPE, so `user.name = 'Ada'` records itself as a change (and
    // assigning the same value again records nothing). `id` is read-only.

    return Record;
  }

  return { defineModel, prepare };
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: the record ──────────────────────────────────────────────────

test('defineModel returns a class you can instantiate', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const user = new User({ name: 'Ash', email: 'ash@x.dev' });
    eq(user.name, 'Ash');
    eq(user.id, null);
    eq(user.isNew(), true);
  });
});

test('save() inserts the row and fills in the id', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const user = new User({ name: 'Ash', email: 'ash@x.dev' }).save();
    ok(user.id > 4, `expected a fresh id, got ${user.id}`);
    eq(user.isNew(), false);
    eq(counter.queries, 1, 'one INSERT, nothing else');
    eq(User.find(user.id).name, 'Ash');
  });
});

test('find() returns an instance, or null when there is no row', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const ada = User.find(1);
    ok(ada instanceof User);
    eq([ada.id, ada.name, ada.email], [1, 'Ada', 'ada@x.dev']);
    eq(User.find(999), null);
  });
});

test('all() returns every row, ordered by id', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    eq(
      User.all().map((u) => u.name),
      ['Ada', 'Grace', 'Linus', 'Margaret']
    );
  });
});

test('create() is new + save in one call', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const user = User.create({ name: 'Ash', email: 'ash@x.dev' });
    eq(user.isNew(), false);
    eq(User.all().length, 5);
  });
});

test('only the fields you set are written — the database fills the rest', () => {
  withOrm(({ orm }) => {
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    const post = Post.create({ user_id: 1, title: 'Untitled' });
    eq(Post.find(post.id).views, 0, 'the column DEFAULT, not NULL');
  });
});

test('rows have a null prototype; toJSON hands back a real object', () => {
  withOrm(({ orm, real }) => {
    const raw = real.prepare('SELECT * FROM users WHERE id = 1').get();
    eq(Object.getPrototypeOf(raw), null, 'this is what node:sqlite gives you');

    const User = orm.defineModel('users', ['name', 'email']);
    const json = User.find(1).toJSON();
    eq(json, { id: 1, name: 'Ada', email: 'ada@x.dev' });
    ok(Object.getPrototypeOf(json) === Object.prototype);
  });
});

// ── stage 2: dirty tracking, update and delete ───────────────────────────

test('assigning a field marks it dirty', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const ada = User.find(1);
    eq(ada.isDirty(), false, 'straight from the database it is clean');
    ada.name = 'Ada Lovelace';
    eq(ada.isDirty(), true);
    eq(ada.changes(), { name: 'Ada Lovelace' });
  });
});

test('assigning the same value is not a change', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const ada = User.find(1);
    ada.name = 'Ada';
    eq(ada.isDirty(), false);
    eq(ada.changes(), {});
  });
});

test('save() writes only the columns that changed', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const ada = User.find(1);
    ada.name = 'Ada Lovelace';
    counter.reset();
    ada.save();
    eq(counter.queries, 1);
    ok(counter.sql[0].includes('name = ?'), counter.sql[0]);
    ok(!counter.sql[0].includes('email'), 'email was never touched');
    eq(User.find(1).name, 'Ada Lovelace');
    eq(ada.isDirty(), false, 'a saved record is clean again');
  });
});

test('saving a clean record runs no query at all', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const ada = User.find(1);
    counter.reset();
    ada.save();
    ada.save();
    eq(counter.queries, 0, 'nothing changed, so there is nothing to write');
  });
});

test('update() assigns a patch and saves it', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const grace = User.find(2);
    counter.reset();
    grace.update({ name: 'Grace Hopper', email: 'grace@navy.mil' });
    eq(counter.queries, 1, 'one UPDATE for both columns');
    eq(User.find(2).toJSON(), {
      id: 2,
      name: 'Grace Hopper',
      email: 'grace@navy.mil',
    });
  });
});

test('delete() removes the row, and saving it afterwards throws', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const margaret = User.find(4);
    eq(margaret.delete(), true);
    eq(User.find(4), null);
    eq(User.all().length, 3);
    throws(() => margaret.save(), 'deleted');
    // node:sqlite enforces foreign keys, so a parent with children stays
    throws(() => User.find(3).delete(), 'FOREIGN KEY');
  });
});

// ── stage 3: queries and prepared statements ─────────────────────────────

test('where() filters on a column', () => {
  withOrm(({ orm }) => {
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    eq(
      Post.where({ user_id: 1 }).map((p) => p.title),
      ['Notes on the Analytical Engine', 'On Loops']
    );
  });
});

test('where() ANDs its conditions, and [] means no match', () => {
  withOrm(({ orm }) => {
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    eq(Post.where({ user_id: 1, views: 40 }).length, 1);
    eq(Post.where({ user_id: 1, views: 999 }), []);
  });
});

test('count() asks the database instead of loading everything', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    counter.reset();
    eq(User.count(), 4);
    eq(counter.queries, 1);
    ok(counter.sql[0].includes('COUNT(*)'), counter.sql[0]);
  });
});

test('the same SQL is prepared once and executed many times', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    counter.reset();
    for (const id of [1, 2, 3, 4, 1]) User.find(id);
    eq(counter.queries, 5);
    eq(counter.prepares, 1, 'one plan, five executions');
  });
});

test('values are bound as parameters, never spliced into the SQL', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    eq(User.where({ name: "'; DROP TABLE users; --" }), []);
    eq(User.count(), 4, 'the table is still there');
  });
});

// ── stage 4: relations, lazy and eager ★ ─────────────────────────────────

test('hasMany adds a lazy accessor that returns child records', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    User.hasMany('posts', { model: Post, foreignKey: 'user_id' });

    const posts = User.find(1).posts();
    eq(posts.length, 2);
    ok(posts[0] instanceof Post);
    eq(posts.map((p) => p.title), [
      'Notes on the Analytical Engine',
      'On Loops',
    ]);
  });
});

test('the relation is loaded once and then cached on the instance', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    User.hasMany('posts', { model: Post, foreignKey: 'user_id' });

    const ada = User.find(1);
    counter.reset();
    ada.posts();
    ada.posts();
    ada.posts();
    eq(counter.queries, 1, 'three calls, one query');
  });
});

test('a parent with no children gets an empty array', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    User.hasMany('posts', { model: Post, foreignKey: 'user_id' });
    eq(User.find(4).posts(), []);
  });
});

test('lazy loading N parents costs N+1 queries — that is the bug', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    User.hasMany('posts', { model: Post, foreignKey: 'user_id' });

    counter.reset();
    const users = User.all();
    const counts = users.map((u) => u.posts().length);
    eq(counts, [2, 2, 1, 0]);
    eq(counter.queries, 5, '1 for the users + 1 per user');
  });
});

test('eager loading costs two queries, whatever N is', () => {
  withOrm(({ orm, counter }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    User.hasMany('posts', { model: Post, foreignKey: 'user_id' });

    counter.reset();
    let users = User.all({ include: ['posts'] });
    eq(users.map((u) => u.posts().length), [2, 2, 1, 0]);
    eq(counter.queries, 2, 'one for users, one for ALL their posts');

    for (let i = 0; i < 6; i += 1) User.create({ name: `user ${i}` });
    counter.reset();
    users = User.all({ include: ['posts'] });
    eq(users.length, 10);
    eq(counter.queries, 2, 'ten parents, still two queries');
  });
});

test('eager and lazy produce exactly the same records', () => {
  withOrm(({ orm }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    User.hasMany('posts', { model: Post, foreignKey: 'user_id' });

    const lazy = User.all().map((u) => u.posts().map((p) => p.toJSON()));
    const eager = User.all({ include: ['posts'] }).map((u) =>
      u.posts().map((p) => p.toJSON())
    );
    eq(eager, lazy);
  });
});

test('include on an empty table never runs the second query', () => {
  withOrm(({ orm, counter, real }) => {
    const User = orm.defineModel('users', ['name', 'email']);
    const Post = orm.defineModel('posts', ['user_id', 'title', 'views']);
    User.hasMany('posts', { model: Post, foreignKey: 'user_id' });

    real.exec('DELETE FROM posts; DELETE FROM users');
    counter.reset();
    eq(User.all({ include: ['posts'] }), []);
    eq(counter.queries, 1, 'no parents means no ids to ask about');
  });
});
