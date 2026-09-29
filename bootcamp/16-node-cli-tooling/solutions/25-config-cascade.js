// ─────────────────────────────────────────────────────────────────────────
//  25 · config cascade — SOLUTION                          ★★★ stretch
//  run: node 25-config-cascade.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one loop per KEY, not one merge per layer. Walking the
//  layers inside the key is what makes provenance possible at all —
//  Object.assign({}, defaults, file, env, argv) produces the same values
//  and then cannot tell you where any of them came from, which is exactly
//  the question every "why is it connecting to prod?" bug asks.
//  `defaults` doubles as the schema. It is the list of keys that exist AND
//  the list of types, so `typeof defaults[key]` is the whole coercion
//  table: everything from the env and from argv arrives as a string, and
//  '8080' !== 8080 the first time someone compares it.
//  `undefined` means absent, everything else means set. That distinction
//  is why `{ port: undefined }` from a parser that saw no --port does not
//  wipe out the config file, and why an empty env var still counts — the
//  shell CAN set a variable to nothing, and APP_DEBUG= means false.
//  Unknown keys are reported rather than merged. A typo'd key silently
//  landing in the config object is a whole afternoon; 'did you mean' needs
//  the list to exist first. Env typos are invisible here by construction —
//  nothing enumerates the environment, it is only ever asked for names it
//  already knows.

import { test, eq, throws } from '../../_lib/check.js';

function envNameFor(prefix, key) {
  return prefix + key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

function coerce(key, value, sample) {
  if (typeof sample === 'number') {
    const n = Number(value);
    if (String(value).trim() === '' || !Number.isFinite(n)) {
      throw new Error(`${key}: expected a number, got '${value}'`);
    }
    return n;
  }
  if (typeof sample === 'boolean') {
    if (typeof value === 'boolean') return value;
    const text = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(text)) return true;
    if (['0', 'false', 'no', 'off', ''].includes(text)) return false;
    throw new Error(`${key}: expected a boolean, got '${value}'`);
  }
  return String(value);
}

export function resolveConfig(
  { defaults, file = {}, env = {}, argv = {} },
  { envPrefix = 'APP_' } = {}
) {
  const values = { ...defaults };
  const sources = {};
  const unknown = [];

  for (const key of Object.keys(defaults)) {
    sources[key] = 'default';
    const layers = [
      ['file', file[key]],
      ['env', env[envNameFor(envPrefix, key)]],
      ['argv', argv[key]],
    ];
    for (const [layer, value] of layers) {
      if (value === undefined) continue;
      values[key] = coerce(key, value, defaults[key]);
      sources[key] = layer;
    }
  }

  for (const bag of [file, argv]) {
    for (const key of Object.keys(bag)) {
      const declared = Object.hasOwn(defaults, key);
      if (!declared && bag[key] !== undefined && !unknown.includes(key)) {
        unknown.push(key);
      }
    }
  }

  return { values, sources, unknown: unknown.sort() };
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
