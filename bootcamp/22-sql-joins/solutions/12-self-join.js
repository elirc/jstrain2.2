// ─────────────────────────────────────────────────────────────────────────
//  12 · joining a table to itself — SOLUTION                  ★★★ stretch
//  run: node 12-self-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a self-join is an ordinary join whose two sides happen to
//  be the same table. The aliases are not decoration — they are the only
//  thing that makes `a.product_id` and `b.product_id` different columns.
//
//      FROM order_items a
//      JOIN order_items b ON b.order_id = a.order_id
//                        AND b.product_id > a.product_id
//      JOIN products pa ON pa.id = a.product_id
//      JOIN products pb ON pb.id = b.product_id
//     GROUP BY a.product_id, b.product_id
//
//  Row-wise: for each line item, find the OTHER line items in the same
//  order. Then GROUP BY the two product ids counts how many orders each
//  pair appeared in.
//  The `>` in the ON clause is doing all the careful work. Without any
//  guard, order 4 (three products) produces 3 × 3 = 9 pairs: three
//  self-pairs and every real pair twice, once each way. `!=` removes the
//  self-pairs and leaves the mirrors — you would report keyboard+mouse and
//  mouse+keyboard as two separate findings. `>` keeps exactly one of each
//  mirrored pair, and a self-pair can never satisfy it. Whole class of bug,
//  one character.
//  That is also why the second pair reads 'mouse' then 'desk mat': the
//  pair is ordered by product ID, which has nothing to do with the
//  alphabet. If you want alphabetical output, sort in the SELECT, not in
//  the guard — the guard must stay on a stable unique key.
//  This query is the entire "customers who bought this also bought…"
//  widget, and the same shape does employee → manager (`employees e JOIN
//  employees m ON m.id = e.manager_id`) and message → reply threads.

import { test, eq, ok } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// ── provided: the same little shop in every file of this module ──────────
//   8 customers · 6 products · 12 orders · 20 line items
//   money is in CENTS (integers — floats and money do not mix)
//   Edsger and Katherine have never ordered; nobody ever bought the
//   laptop stand. Those three gaps are what the joins are for.
const SCHEMA = `
  CREATE TABLE customers (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL
  );
  CREATE TABLE products (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL,
    price INTEGER NOT NULL
  );
  CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    placed_on   TEXT    NOT NULL,
    total_cents INTEGER NOT NULL
  );
  CREATE TABLE order_items (
    id         INTEGER PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    qty        INTEGER NOT NULL
  );
`;

const CUSTOMERS = [
  // id, name, city
  [1, 'Ada', 'London'],        [2, 'Grace', 'New York'],
  [3, 'Linus', 'Helsinki'],    [4, 'Margaret', 'Boston'],
  [5, 'Alan', 'London'],       [6, 'Barbara', 'New York'],
  [7, 'Edsger', 'Amsterdam'],  [8, 'Katherine', 'Hampton'],
];
const PRODUCTS = [
  // id, name, price
  [1, 'keyboard', 7200],  [2, 'mouse', 2500],
  [3, 'monitor', 19900],  [4, 'desk mat', 1500],
  [5, 'usb hub', 4500],   [6, 'laptop stand', 6000],
];
const ORDERS = [
  // id, customer_id, placed_on, total_cents
  [1, 1, '2024-01-05', 12200],  [2, 2, '2024-01-17', 19900],
  [3, 1, '2024-02-02', 7000],   [4, 3, '2024-02-14', 14200],
  [5, 4, '2024-02-28', 47000],  [6, 2, '2024-03-03', 1500],
  [7, 5, '2024-03-11', 9700],   [8, 1, '2024-03-22', 9000],
  [9, 6, '2024-04-02', 5500],   [10, 2, '2024-04-14', 24400],
  [11, 3, '2024-04-25', 14400], [12, 4, '2024-05-06', 2500],
];
const ITEMS = [
  // id, order_id, product_id, qty
  [1, 1, 1, 1],   [2, 1, 2, 2],   [3, 2, 3, 1],   [4, 3, 2, 1],
  [5, 3, 4, 3],   [6, 4, 1, 1],   [7, 4, 2, 1],   [8, 4, 5, 1],
  [9, 5, 3, 2],   [10, 5, 1, 1],  [11, 6, 4, 1],  [12, 7, 1, 1],
  [13, 7, 2, 1],  [14, 8, 5, 2],  [15, 9, 2, 1],  [16, 9, 4, 2],
  [17, 10, 3, 1], [18, 10, 5, 1], [19, 11, 1, 2], [20, 12, 2, 1],
];

// Open the shop, run your test body, always close it.
function withShop(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const load = (sql, rows) => {
    const stmt = db.prepare(sql);
    for (const row of rows) stmt.run(...row);
  };
  load('INSERT INTO customers   VALUES (?, ?, ?)', CUSTOMERS);
  load('INSERT INTO products    VALUES (?, ?, ?)', PRODUCTS);
  load('INSERT INTO orders      VALUES (?, ?, ?, ?)', ORDERS);
  load('INSERT INTO order_items VALUES (?, ?, ?, ?)', ITEMS);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function boughtTogether(db, minTimes) {
  return db
    .prepare(
      `SELECT pa.name  AS product_a,
              pb.name  AS product_b,
              COUNT(*) AS times
         FROM order_items a
         JOIN order_items b ON b.order_id   = a.order_id
                           AND b.product_id > a.product_id
         JOIN products pa ON pa.id = a.product_id
         JOIN products pb ON pb.id = b.product_id
        GROUP BY a.product_id, b.product_id
       HAVING COUNT(*) >= ?
        ORDER BY times DESC, product_a, product_b`
    )
    .all(minTimes)
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('two pairs were bought together more than once', () => {
  withShop((db) => {
    eq(boughtTogether(db, 2), [
      { product_a: 'keyboard', product_b: 'mouse', times: 3 },
      { product_a: 'mouse', product_b: 'desk mat', times: 2 },
    ]);
  });
});

test('six distinct pairs ever shared a basket', () => {
  withShop((db) => {
    const pairs = boughtTogether(db, 1);
    eq(pairs.length, 6);
    eq(pairs[0].times, 3, 'most frequent first');
    eq(pairs.at(-1).times, 1);
  });
});

test('nothing was bought together four times', () => {
  withShop((db) => {
    eq(boughtTogether(db, 4), []);
  });
});

test('no product is ever paired with itself', () => {
  withShop((db) => {
    const pairs = boughtTogether(db, 1);
    ok(pairs.every((p) => p.product_a !== p.product_b));
    const unguarded = db
      .prepare(
        `SELECT COUNT(*) AS n
           FROM order_items a
           JOIN order_items b ON b.order_id = a.order_id`
      )
      .get().n;
    eq(unguarded, 38, 'without the guard: self-pairs and mirrors');
  });
});

test('each pair is reported once, not once per direction', () => {
  withShop((db) => {
    const pairs = boughtTogether(db, 1);
    const seen = new Set(pairs.map((p) => `${p.product_a}|${p.product_b}`));
    eq(seen.size, pairs.length);
    for (const p of pairs) {
      ok(
        !seen.has(`${p.product_b}|${p.product_a}`),
        `${p.product_b} + ${p.product_a} is the same finding`
      );
    }
  });
});

test('the ids order the pair, not the alphabet', () => {
  withShop((db) => {
    const pair = boughtTogether(db, 2)[1];
    eq(pair.product_a, 'mouse', 'mouse is product 2');
    eq(pair.product_b, 'desk mat', 'desk mat is product 4');
  });
});

test('one more basket and the top pair climbs to four', () => {
  withShop((db) => {
    db.exec(`INSERT INTO orders      VALUES (13, 1, '2024-06-01', 9700);
             INSERT INTO order_items VALUES (21, 13, 1, 1), (22, 13, 2, 1)`);
    eq(boughtTogether(db, 2), [
      { product_a: 'keyboard', product_b: 'mouse', times: 4 },
      { product_a: 'mouse', product_b: 'desk mat', times: 2 },
    ]);
  });
});
