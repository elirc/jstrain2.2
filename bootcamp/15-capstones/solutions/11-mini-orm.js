// ─────────────────────────────────────────────────────────────────────────
//  11 · mini ORM — SOLUTION                                 ★★★ capstone
//  concepts: classes · accessors · prepared statements · N+1
//  time: 45–60 min · 4 stages · 25 tests
//  run: node 11-mini-orm.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Three layers, and keeping them apart is the exercise.
//    · `createOrm(db)` owns the connection and ONE statement cache. Every
//      SQL string in the file goes through its `prepare()`, so a query
//      text is compiled once per process no matter how often it runs.
//    · `defineModel(table, fields)` builds a class per table. The fields
//      list is not decoration: it drives the accessors, the INSERT column
//      list and the hydration, so the class knows its own shape.
//    · An instance is one row plus two pieces of bookkeeping — `attrs`
//      (the values) and `dirty` (which of them the caller touched).
//
//  The boundary rule. `node:sqlite` hands back rows with a NULL
//  prototype: `Object.getPrototypeOf(row) === null`, so `row.hasOwnProperty`
//  is a TypeError and `{ ...row }` is how you re-enter normal JavaScript.
//  Do it once, at the edge (`hydrate`), never sprinkled through the code.
//  The same rule applies going the other way: values leave as parameters,
//  never as text spliced into SQL.
//
//  Stage 1 — accessors. `Object.defineProperty` on the PROTOTYPE, one
//  getter/setter pair per field, is what makes `user.name = 'Ada'` a
//  method call in disguise. That single trick is the whole magic of
//  ActiveRecord: plain-looking property assignment that records itself.
//  Doing it on the prototype (not per instance) means one pair of
//  closures per model, not per row.
//
//  Stage 2 — dirty tracking. `save()` has exactly three outcomes: no id →
//  INSERT the columns you set; id + dirty → UPDATE only those columns;
//  id + clean → NO QUERY AT ALL. That last one matters more than it
//  looks — it is why an ORM can be called in a loop and still be quiet,
//  and it is why UPDATE touches one column instead of clobbering
//  concurrent writers' changes to the other nine (the classic
//  last-write-wins data loss). `node:sqlite` turns foreign keys ON by
//  default, so deleting a parent that still has children throws — which
//  is why every ORM grows a `dependent: :destroy` option eventually.
//
//  Stage 3 — statements. Preparing compiles SQL into a plan; caching by
//  SQL TEXT is what turns `find()` in a loop from "parse a string 1000
//  times" into one parse and 1000 executions. It also forces the good
//  habit: the SQL string is built from identifiers you control and the
//  values always arrive as `?` parameters. Notice `whereIn` builds
//  `IN (?, ?, ?)` from the COUNT of ids — you cannot bind an array, and
//  every ORM has this same little placeholder-joining function.
//
//  Stage 4 — N+1 ★. `user.posts()` is lazy: the first call queries, the
//  result is cached on the instance. Convenient, and a trap — a loop
//  over 200 users is 201 round trips, which is the single most common
//  performance bug in web apps. `all({ include: ['posts'] })` is the fix:
//  one query for the parents, ONE for all their children
//  (`WHERE user_id IN (…)`), then group them in JS and push them into
//  the caches so the lazy accessor never fires. Two queries for any N.
//  The test asserting `counter.queries === 2` is the point of the file:
//  N+1 is invisible in code review and obvious in a query count.
//
//  Bridge: module 19 taught DatabaseSync, prepare and run; module 22
//  taught the join that kills N+1 in raw SQL. This file is where those
//  two meet — the layer that made the problem easy to write in the first
//  place, built by hand so you can see through it.
//
//  Classic wrong turn: making the relation a GETTER (`user.posts`)
//  instead of a method. A property that silently fires a database query
//  is a property nobody expects to cost 3ms — and it makes
//  `console.log(user)`, `JSON.stringify(user)` and the debugger issue
//  queries behind your back.

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

export function createOrm(db) {
  // stage 3 — one cache for the whole connection: SQL text → statement.
  const statements = new Map();
  const prepare = (sql) => {
    let stmt = statements.get(sql);
    if (!stmt) {
      stmt = db.prepare(sql);
      statements.set(sql, stmt);
    }
    return stmt;
  };

  function defineModel(table, fields) {
    class Record {
      static table = table;
      static fields = fields;
      static relations = new Map();

      // stage 1 — a row plus bookkeeping. Anything you pass in counts as
      // a change, so a brand new record INSERTs exactly what you set.
      constructor(attrs = {}) {
        this.attrs = { id: attrs.id ?? null };
        this.dirty = new Set();
        this.related = new Map(); // stage 4: loaded relations
        this.deleted = false;
        for (const field of fields) {
          if (field in attrs) {
            this.attrs[field] = attrs[field];
            this.dirty.add(field);
          } else {
            this.attrs[field] = null;
          }
        }
      }

      // stage 1 — the boundary: a null-prototype row becomes an object.
      static hydrate(row) {
        const record = new Record({ ...row });
        record.dirty.clear(); // it came FROM the database; nothing to write
        return record;
      }

      static find(id) {
        const row = prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
        return row ? Record.hydrate(row) : null;
      }

      // stage 1 — every row. stage 4 — `include` preloads relations.
      static all({ include = [] } = {}) {
        const records = prepare(`SELECT * FROM ${table} ORDER BY id`)
          .all()
          .map((row) => Record.hydrate(row));
        for (const name of include) Record.preload(records, name);
        return records;
      }

      // stage 3 — one `?` per condition, ANDed. Values never touch SQL.
      static where(conditions = {}) {
        const cols = Object.keys(conditions);
        const clause = cols.length
          ? ` WHERE ${cols.map((c) => `${c} = ?`).join(' AND ')}`
          : '';
        return prepare(`SELECT * FROM ${table}${clause} ORDER BY id`)
          .all(...cols.map((c) => conditions[c]))
          .map((row) => Record.hydrate(row));
      }

      // stage 4 — you cannot bind an array, so build the placeholders.
      static whereIn(column, values) {
        const holes = values.map(() => '?').join(', ');
        return prepare(
          `SELECT * FROM ${table} WHERE ${column} IN (${holes}) ORDER BY id`
        )
          .all(...values)
          .map((row) => Record.hydrate(row));
      }

      static create(attrs) {
        return new Record(attrs).save();
      }

      static count() {
        return prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
      }

      // stage 4 — a lazy accessor plus the metadata preload() needs.
      static hasMany(name, { model, foreignKey }) {
        Record.relations.set(name, { model, foreignKey });
        Record.prototype[name] = function loadRelation() {
          if (!this.related.has(name)) {
            this.related.set(name, model.where({ [foreignKey]: this.attrs.id }));
          }
          return this.related.get(name);
        };
        return Record;
      }

      // stage 4 — ONE query for every parent's children, then group.
      static preload(records, name) {
        const relation = Record.relations.get(name);
        if (!relation) throw new Error(`unknown relation: ${name}`);
        if (records.length === 0) return records; // nothing to ask about

        const { model, foreignKey } = relation;
        const children = model.whereIn(
          foreignKey,
          records.map((r) => r.attrs.id)
        );
        const grouped = new Map(records.map((r) => [r.attrs.id, []]));
        for (const child of children) {
          grouped.get(child[foreignKey])?.push(child);
        }
        for (const record of records) {
          record.related.set(name, grouped.get(record.attrs.id));
        }
        return records;
      }

      isNew() {
        return this.attrs.id === null;
      }

      isDirty() {
        return this.dirty.size > 0;
      }

      changes() {
        return Object.fromEntries(
          [...this.dirty].map((field) => [field, this.attrs[field]])
        );
      }

      toJSON() {
        return { ...this.attrs };
      }

      // stage 1 + 2 — insert, update-what-changed, or do nothing.
      save() {
        if (this.deleted) throw new Error('cannot save a deleted record');
        const cols = [...this.dirty];

        if (this.isNew()) {
          const holes = cols.map(() => '?').join(', ');
          const info = prepare(
            `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${holes})`
          ).run(...cols.map((c) => this.attrs[c]));
          this.attrs.id = Number(info.lastInsertRowid);
        } else if (cols.length > 0) {
          const sets = cols.map((c) => `${c} = ?`).join(', ');
          prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).run(
            ...cols.map((c) => this.attrs[c]),
            this.attrs.id
          );
        }
        this.dirty.clear();
        return this;
      }

      update(patch) {
        Object.assign(this, patch); // goes through the setters
        return this.save();
      }

      delete() {
        if (this.isNew() || this.deleted) return false;
        const info = prepare(`DELETE FROM ${table} WHERE id = ?`).run(
          this.attrs.id
        );
        this.deleted = true;
        return info.changes > 0;
      }
    }

    // stage 1 — property assignment that records itself.
    for (const field of fields) {
      Object.defineProperty(Record.prototype, field, {
        get() {
          return this.attrs[field];
        },
        set(value) {
          if (this.attrs[field] === value) return; // not a change
          this.attrs[field] = value;
          this.dirty.add(field);
        },
        enumerable: true,
        configurable: true,
      });
    }
    Object.defineProperty(Record.prototype, 'id', {
      get() {
        return this.attrs.id;
      },
      enumerable: true,
      configurable: true,
    });

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
