// fixture for exercise 14 — a complete, working module.
// Do not edit; import from it and AUGMENT it from the exercise file.
//
// The registry is deliberately born empty: `PluginRegistry` has no
// members, so `PluginName` is `never` and `register` accepts nothing.
// Consumers declare what they plug in by reopening this interface from
// their own file — the pattern every plugin system in the TS ecosystem
// uses (Vite's `ImportMeta.env`, Express's `Request.user`, Vue's
// `GlobalComponents`, Fastify's decorators).

export interface PluginRegistry {}

export type PluginName = keyof PluginRegistry;

const plugins = new Map<string, unknown>();

export function register<K extends PluginName>(
  name: K,
  plugin: PluginRegistry[K]
): void {
  plugins.set(String(name), plugin);
}

export function get<K extends PluginName>(name: K): PluginRegistry[K] {
  const key = String(name);
  if (!plugins.has(key)) throw new Error(`no plugin registered: ${key}`);
  return plugins.get(key) as PluginRegistry[K];
}

export function names(): PluginName[] {
  return [...plugins.keys()] as PluginName[];
}

export function reset(): void {
  plugins.clear();
}
