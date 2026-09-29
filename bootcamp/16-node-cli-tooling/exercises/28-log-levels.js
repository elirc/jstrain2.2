// ─────────────────────────────────────────────────────────────────────────
//  28 · leveled logger                                     ★★☆ core
//  concepts: lookup tables · factories · dependency injection
//  run: node 28-log-levels.js
// ─────────────────────────────────────────────────────────────────────────
//
//  -q and -v are the same knob at two settings. Four levels, five
//  channels, one sink — and the sink is passed in, so the logger has no
//  idea whether it is writing to stderr or to an array in a test.
//
//      const log = createLogger({ sink, level: 'verbose' });
//      log.error('boom')      → 'error: boom'
//      log.warn('careful')    → 'warn: careful'
//      log.info('hello')      → 'hello'
//      log.verbose('detail')  → 'detail'
//      log.debug('guts')      → nothing, at this level
//
//      level:   quiet   normal   verbose   debug
//      prints:  error   + warn   + verbose  + debug
//                       + info
//
//  error, warn and debug are tagged; info and verbose are bare.
//  `log.enabled('debug')` answers "would this print?" so you can skip
//  building an expensive message. `log.child('db')` returns a logger that
//  stamps '[db] ' in front of every line, before the tag, and children of
//  children join with a colon: '[db:pool] opened'. A level name that does
//  not exist throws `unknown level: loud`.
//
//  hint: levels are ranks — one table of level → number, one table of
//  channel → { minimum rank, tag }, and the rest is a comparison

import { test, eq, throws } from '../../_lib/check.js';

export function createLogger({ level = 'normal', sink, prefix = '' } = {}) {
  throw new Error('TODO');
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
