// ─────────────────────────────────────────────────────────────────────────
//  28 · leveled logger — SOLUTION                          ★★☆ core
//  run: node 28-log-levels.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two tables and one comparison. Levels are RANKS, so
//  "should this print?" is `rank >= channel.min` — a number against a
//  number. Written as a chain of if-statements instead, adding a level
//  means editing five functions and getting one of them wrong.
//  The channel table also owns the tag, which is why the five methods are
//  generated in a loop rather than written out. Every channel then
//  behaves identically by construction: same prefix handling, same sink,
//  same shape. error and warn are labelled because they interrupt; info
//  and verbose are bare because they ARE the output.
//  `child` returns a NEW logger instead of mutating anything, so the
//  parent keeps writing unprefixed lines while the child writes tagged
//  ones — the classic bug here is a shared `prefix` variable that the
//  first child sets and every later line inherits for ever.
//  `enabled` exists for the expensive message: JSON.stringify of a big
//  object costs the same whether or not the line is thrown away, so you
//  ask first. And the sink is a parameter — the logger has no idea
//  whether it is writing to stderr, a file or an array in a test.

import { test, eq, throws } from '../../_lib/check.js';

const LEVELS = { quiet: 0, normal: 1, verbose: 2, debug: 3 };

const CHANNELS = {
  error: { min: 0, tag: 'error: ' },
  warn: { min: 1, tag: 'warn: ' },
  info: { min: 1, tag: '' },
  verbose: { min: 2, tag: '' },
  debug: { min: 3, tag: 'debug: ' },
};

export function createLogger({ level = 'normal', sink, prefix = '' } = {}) {
  if (!Object.hasOwn(LEVELS, level)) throw new Error(`unknown level: ${level}`);

  const rank = LEVELS[level];
  const head = prefix ? `[${prefix}] ` : '';

  const logger = {
    enabled: (channel) => rank >= CHANNELS[channel].min,
    child: (name) =>
      createLogger({
        level,
        sink,
        prefix: prefix ? `${prefix}:${name}` : name,
      }),
  };

  for (const [channel, { min, tag }] of Object.entries(CHANNELS)) {
    logger[channel] = (message) => {
      if (rank < min) return;
      sink(`${head}${tag}${message}`);
    };
  }

  return logger;
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a sink that remembers, and one shout on every channel.
function recorder() {
  const lines = [];
  return { sink: (line) => lines.push(line), lines: () => lines };
}

const shout = (log) => {
  log.error('boom');
  log.warn('careful');
  log.info('hello');
  log.verbose('detail');
  log.debug('guts');
};

test('the default level prints error, warn and info, and stops there', () => {
  const { sink, lines } = recorder();
  shout(createLogger({ sink }));
  eq(lines(), ['error: boom', 'warn: careful', 'hello']);
});

test('quiet silences everything except error', () => {
  const { sink, lines } = recorder();
  shout(createLogger({ sink, level: 'quiet' }));
  eq(lines(), ['error: boom']);
});

test('verbose opens one more channel — still not debug', () => {
  const { sink, lines } = recorder();
  shout(createLogger({ sink, level: 'verbose' }));
  eq(lines(), ['error: boom', 'warn: careful', 'hello', 'detail']);
});

test('debug prints all five, and only error and debug carry a tag', () => {
  const { sink, lines } = recorder();
  shout(createLogger({ sink, level: 'debug' }));
  eq(lines(), [
    'error: boom',
    'warn: careful',
    'hello',
    'detail',
    'debug: guts',
  ]);
});

test('enabled answers the question without building the message', () => {
  const { sink } = recorder();
  const log = createLogger({ sink });
  eq(log.enabled('info'), true);
  eq(log.enabled('verbose'), false);
  eq(createLogger({ sink, level: 'debug' }).enabled('debug'), true);
  eq(createLogger({ sink, level: 'quiet' }).enabled('error'), true);
});

test('a child stamps its prefix on every line it writes', () => {
  const { sink, lines } = recorder();
  const db = createLogger({ sink }).child('db');
  db.info('connected');
  db.warn('slow query');
  eq(lines(), ['[db] connected', '[db] warn: slow query']);
});

test('children nest, and the parent goes on writing bare lines', () => {
  const { sink, lines } = recorder();
  const log = createLogger({ sink });
  log.child('db').child('pool').info('opened');
  log.info('ready');
  eq(lines(), ['[db:pool] opened', 'ready']);
});

test('a child keeps the level, and an unknown level throws', () => {
  const { sink, lines } = recorder();
  createLogger({ sink, level: 'quiet' }).child('db').info('hush');
  eq(lines(), []);
  throws(() => createLogger({ sink, level: 'loud' }), 'unknown level: loud');
});
