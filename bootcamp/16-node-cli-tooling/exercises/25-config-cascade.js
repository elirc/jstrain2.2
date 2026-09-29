// ─────────────────────────────────────────────────────────────────────────
//  25 · config cascade                                     ★★★ stretch
//  concepts: layered configuration · provenance · type coercion
//  run: node 25-config-cascade.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every tool reads its settings from four places, and the order is
//  always the same: built-in defaults, then the config file, then the
//  environment, then the command line. Merging them is easy. Answering
//  "and WHERE did port 9000 come from?" is the part people leave out.
//
//      resolveConfig({ defaults: { port: 8080, debug: false },
//                      file: { port: 3000 },
//                      env: { APP_DEBUG: 'yes' },
//                      argv: { port: 9000 } })
//
//        → { values:  { port: 9000, debug: true },
//            sources: { port: 'argv', debug: 'env' },
//            unknown: [] }
//
//  `defaults` is also the schema: only its keys resolve, and the type of
//  each default is what env and argv strings are coerced to ('9000' → a
//  number, 'yes'/'1'/'on' → true, ''/'0'/'no' → false). A value that
//  will not coerce throws `port: expected a number, got 'abc'`.
//  An env key is envPrefix + the SCREAMING_SNAKE of the name, so
//  `maxRetries` reads APP_MAX_RETRIES. `undefined` in a layer means the
//  layer said nothing. Keys that are in `file` or `argv` but not in the
//  defaults go into `unknown` (sorted) instead of into `values`.
//
//  hint: loop over the KEYS on the outside and the layers on the inside —
//  that is the shape that can record a source

import { test, eq, throws } from '../../_lib/check.js';

export function resolveConfig(
  { defaults, file = {}, env = {}, argv = {} },
  { envPrefix = 'APP_' } = {}
) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: the defaults double as the schema — keys and types.
const DEFAULTS = { host: 'localhost', port: 8080, debug: false, maxRetries: 3 };

const cascade = () =>
  resolveConfig({
    defaults: DEFAULTS,
    file: { host: 'file.example', port: 3000, debug: true },
    env: { APP_PORT: '5000', APP_DEBUG: 'false' },
    argv: { port: 9000 },
  });

test('with nothing set, every value comes from the defaults', () => {
  const config = resolveConfig({ defaults: DEFAULTS });
  eq(config.values, DEFAULTS);
  eq(config.sources, {
    host: 'default',
    port: 'default',
    debug: 'default',
    maxRetries: 'default',
  });
  eq(config.unknown, []);
});

test('each layer beats the one below it: default < file < env < argv', () => {
  eq(cascade().values, {
    host: 'file.example',
    port: 9000,
    debug: false,
    maxRetries: 3,
  });
});

test('sources say which layer each value came from, key by key', () => {
  eq(cascade().sources, {
    host: 'file',
    port: 'argv',
    debug: 'env',
    maxRetries: 'default',
  });
});

test('an env key is the prefixed SCREAMING_SNAKE form of the name', () => {
  const config = resolveConfig({
    defaults: DEFAULTS,
    env: { APP_MAX_RETRIES: '7', APP_MAXRETRIES: '99' },
  });
  eq(config.values.maxRetries, 7);
  eq(config.sources.maxRetries, 'env');
});

test('strings coerce to the type of the default, empty ones included', () => {
  const config = resolveConfig({
    defaults: DEFAULTS,
    env: { APP_PORT: '5000', APP_DEBUG: 'yes' },
    argv: { maxRetries: '2' },
  });
  eq(config.values.port, 5000);
  eq(config.values.debug, true);
  eq(config.values.maxRetries, 2);

  // an env var set to nothing is still SET — and that reads as false
  const empty = resolveConfig({
    defaults: DEFAULTS,
    file: { debug: true },
    env: { APP_DEBUG: '' },
  });
  eq(empty.values.debug, false);
  eq(empty.sources.debug, 'env');
});

test('an explicit undefined does not count as setting anything', () => {
  const config = resolveConfig({
    defaults: DEFAULTS,
    file: { host: 'file.example' },
    argv: { host: undefined, port: undefined },
  });
  eq(config.values.host, 'file.example');
  eq(config.sources.host, 'file');
  eq(config.sources.port, 'default');
  eq(config.unknown, []);
});

test('a key nobody declared is reported, not merged in', () => {
  const config = resolveConfig({
    defaults: DEFAULTS,
    file: { colour: 'red' },
    argv: { verbose: true },
  });
  eq(config.unknown, ['colour', 'verbose']);
  eq(Object.hasOwn(config.values, 'colour'), false);
});

test('a value that will not coerce throws, naming the key', () => {
  throws(
    () => resolveConfig({ defaults: DEFAULTS, argv: { port: 'abc' } }),
    "port: expected a number, got 'abc'"
  );
  throws(
    () => resolveConfig({ defaults: DEFAULTS, env: { APP_DEBUG: 'maybe' } }),
    'debug: expected a boolean'
  );
});
