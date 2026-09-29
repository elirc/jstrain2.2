export type Role = 'admin'|'catalog'|'purchasing'|'warehouse'|'sales'|'viewer';
export type Permission = 'catalog:write'|'purchase:write'|'receive:write'|'sales:write'|'ship:write'|'inventory:adjust'|'reports:read';
const grants: Record<Role, readonly Permission[]> = {
  admin: ['catalog:write','purchase:write','receive:write','sales:write','ship:write','inventory:adjust','reports:read'],
  catalog: ['catalog:write','reports:read'], purchasing: ['purchase:write','receive:write','reports:read'],
  warehouse: ['receive:write','ship:write','inventory:adjust','reports:read'], sales: ['sales:write','reports:read'], viewer: ['reports:read']
};
export const can = (role: Role, permission: Permission) => grants[role].includes(permission);
export class DomainError extends Error { constructor(public code: string, message: string, public status=409){ super(message); } }
export const assertPositive = (value:number, name='quantity') => { if(!Number.isSafeInteger(value)||value<=0) throw new DomainError('VALIDATION_ERROR', `${name} must be a positive integer`, 422); return value; };
export const available = (onHand:number, reserved:number) => onHand-reserved;
export type PurchaseState='draft'|'submitted'|'partially_received'|'received'|'cancelled';
export function receiveState(state:PurchaseState, received:number, ordered:number):PurchaseState { if(!['submitted','partially_received'].includes(state)) throw new DomainError('INVALID_TRANSITION','Purchase order cannot be received'); return received===ordered?'received':'partially_received'; }
export type SalesState='draft'|'reserved'|'partially_shipped'|'shipped'|'cancelled';
export function shipState(state:SalesState, shipped:number, ordered:number):SalesState { if(!['reserved','partially_shipped'].includes(state)) throw new DomainError('INVALID_TRANSITION','Sales order cannot be shipped'); return shipped===ordered?'shipped':'partially_shipped'; }
export const retryDelay = (attempt:number) => Math.min(60_000, 250 * 2 ** Math.max(0,attempt-1));
