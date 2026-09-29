// ─────────────────────────────────────────────────────────────────────────
//  18 · middleware pipeline — SOLUTION                       ★★★ stretch
//  concepts: chain of responsibility · middleware · onion model
//  run: node solutions/18-middleware-chain.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — hand a request down a line of independent handlers, each of
//  which may handle it, decorate it, or pass it along.
//  The engine is six lines: `dispatch(i)` runs stack[i] and gives it a
//  `next` that runs `dispatch(i + 1)`. Because `next()` is a normal call,
//  everything a middleware writes *after* it runs on the way back out —
//  that is the onion, and it is how a timing or error-handling
//  middleware wraps everything downstream.
//  The `index` guard turns "called next twice" from a weird double
//  execution into a loud error; Koa ships exactly this check.
//  When NOT to use: a fixed three-step flow with no plug-in point is
//  clearer written out. The cost of a pipeline is that no one can tell
//  what runs by reading one file, and order becomes load-bearing.
//  In the wild: Express/Koa middleware, Redux middleware
//  (`store => next => action`), Rack, ASP.NET Core, fetch interceptors.
//  Async note: this version is synchronous. Make `dispatch` return
//  `await fn(ctx, next)` and every middleware must `await next()` — a
//  missing await is the classic "my logging middleware timed nothing".

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createPipeline() {
  const stack = [];

  const pipeline = {
    use(fn) {
      stack.push(fn);
      return pipeline;
    },
    run(ctx) {
      let called = -1;
      const dispatch = (i) => {
        if (i <= called) throw new Error('next() called multiple times');
        called = i;
        const fn = stack[i];
        if (!fn) return;
        fn(ctx, () => dispatch(i + 1));
      };
      dispatch(0);
      return ctx;
    },
  };

  return pipeline;
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
