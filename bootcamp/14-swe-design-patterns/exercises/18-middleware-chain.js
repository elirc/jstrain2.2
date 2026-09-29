// ─────────────────────────────────────────────────────────────────────────
//  18 · middleware pipeline                                  ★★★ stretch
//  concepts: chain of responsibility · middleware · onion model
//  run: node exercises/18-middleware-chain.js
// ─────────────────────────────────────────────────────────────────────────
//
//  This is the pattern Express, Koa and Redux all run on: a list of
//  handlers, each free to do work, pass control on, do more work when
//  control comes back — or stop the chain dead.
//
//      const app = createPipeline();
//      app.use((ctx, next) => { ctx.log.push('auth');   next(); })
//         .use((ctx, next) => { ctx.log.push('in');
//                               next();
//                               ctx.log.push('out'); })
//         .use((ctx) => { ctx.body = 'hello'; });
//      app.run({ log: [] })
//        → the same ctx, with log ['auth', 'in', 'out'] and body 'hello'
//
//  Note the *onion*: whatever a middleware does after `next()` runs
//  after everything downstream has finished.
//
//  Rules:
//    · use() returns the pipeline so calls chain
//    · run(ctx) returns the ctx it was given
//    · a middleware that never calls next() stops the chain
//    · errors thrown by a middleware propagate out of run()
//    · calling next() twice is a bug: throw
//      'next() called multiple times'
//
//  hint: a recursive `dispatch(i)` that calls stack[i] with a `next`
//  bound to `dispatch(i + 1)`, and remembers the highest i it has seen

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createPipeline() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('middleware run in the order they were added', () => {
  const app = createPipeline();
  app.use((ctx, next) => {
    ctx.log.push('first');
    next();
  });
  app.use((ctx, next) => {
    ctx.log.push('second');
    next();
  });
  eq(app.run({ log: [] }).log, ['first', 'second']);
});

test('the context flows through and comes back out', () => {
  const app = createPipeline();
  const ctx = { log: [], user: null };
  app.use((c, next) => {
    c.user = 'ada';
    next();
  });
  app.use((c) => {
    c.body = `hello ${c.user}`;
  });
  ok(app.run(ctx) === ctx, 'run should return the ctx it was given');
  eq(ctx.body, 'hello ada');
});

test('work after next() happens on the way back out', () => {
  const app = createPipeline();
  app.use((ctx, next) => {
    ctx.log.push('a-in');
    next();
    ctx.log.push('a-out');
  });
  app.use((ctx, next) => {
    ctx.log.push('b-in');
    next();
    ctx.log.push('b-out');
  });
  eq(app.run({ log: [] }).log, ['a-in', 'b-in', 'b-out', 'a-out']);
});

test('a middleware that skips next() stops the chain', () => {
  const app = createPipeline();
  app.use((ctx) => {
    ctx.status = 401;
  });
  app.use((ctx) => {
    ctx.status = 200;
    ctx.log.push('handler');
  });
  const ctx = app.run({ log: [] });
  eq(ctx.status, 401);
  eq(ctx.log, []);
});

test('use is chainable and an empty pipeline is a no-op', () => {
  const app = createPipeline();
  ok(app.use((ctx, next) => next()) === app, 'use should return the pipeline');
  eq(createPipeline().run({ log: [] }), { log: [] });
});

test('an error inside a middleware bubbles out of run', () => {
  const app = createPipeline();
  app.use((ctx, next) => {
    ctx.log.push('before');
    next();
  });
  app.use(() => {
    throw new Error('handler exploded');
  });
  throws(() => app.run({ log: [] }), 'handler exploded');
});

test('calling next() twice is reported, not silently tolerated', () => {
  const app = createPipeline();
  app.use((ctx, next) => {
    next();
    next();
  });
  app.use((ctx) => ctx.log.push('once'));
  throws(() => app.run({ log: [] }), 'next() called multiple times');
});
