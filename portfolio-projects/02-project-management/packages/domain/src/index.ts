export type OrgRole = 'owner'|'admin'|'manager'|'contributor'|'guest'|'viewer';
export type Action = 'org:admin'|'project:configure'|'task:read'|'task:write'|'comment:write'|'attachment:write';
const grants: Record<OrgRole, ReadonlySet<Action>> = {
  owner: new Set(['org:admin','project:configure','task:read','task:write','comment:write','attachment:write']),
  admin: new Set(['org:admin','project:configure','task:read','task:write','comment:write','attachment:write']),
  manager: new Set(['project:configure','task:read','task:write','comment:write','attachment:write']),
  contributor: new Set(['task:read','task:write','comment:write','attachment:write']),
  guest: new Set(['task:read','task:write','comment:write','attachment:write']),
  viewer: new Set(['task:read'])
};
export function can(role: OrgRole, action: Action): boolean { return grants[role].has(action); }
export function rankBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1024;
  if (before === null) return after! - 1024;
  if (after === null) return before + 1024;
  if (after <= before) throw new Error('Invalid rank anchors');
  return before + (after - before) / 2;
}
export function assertWip(current: number, limit: number | null, movingWithinColumn: boolean): void {
  if (!movingWithinColumn && limit !== null && current >= limit) throw new DomainError('WIP_LIMIT', 'The destination column reached its work-in-progress limit');
}
export class DomainError extends Error { constructor(public readonly code: string, message: string) { super(message); } }
export function retryDelay(attempt: number): number { return Math.min(60_000, 500 * 2 ** Math.max(0, attempt - 1)); }
