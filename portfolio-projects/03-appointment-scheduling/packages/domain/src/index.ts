import { DateTime } from 'luxon';
import type { Role } from '../../contracts/src/index.js';

export type AppointmentState = 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
const transitions: Record<AppointmentState, readonly AppointmentState[]> = {
  confirmed: ['checked_in', 'cancelled', 'no_show'], checked_in: ['in_progress', 'cancelled'], in_progress: ['completed'], completed: [], no_show: [], cancelled: []
};
export function transition(current: AppointmentState, next: AppointmentState): AppointmentState {
  if (!transitions[current].includes(next)) throw new DomainError('INVALID_STATE', `Cannot transition ${current} to ${next}`);
  return next;
}
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean { return aStart < bEnd && bStart < aEnd; }
export function can(role: Role, action: 'configure'|'book'|'view_schedule'|'check_in'|'clinical'): boolean {
  const policy: Record<typeof action, readonly Role[]> = { configure: ['admin'], book: ['admin','scheduler','customer'], view_schedule: ['admin','scheduler','provider','reception'], check_in: ['admin','scheduler','provider','reception'], clinical: ['admin','provider'] };
  return policy[action].includes(role);
}
export type LocalResolution = { utc: string; offsetMinutes: number };
export function resolveLocal(localIso: string, timeZone: string, requestedOffset?: number): LocalResolution {
  const wall = DateTime.fromISO(`${localIso}Z`, { zone: 'UTC' });
  if (!wall.isValid) throw new DomainError('DST_GAP', 'Local time does not exist in this zone');
  const offsets = new Set([DateTime.fromMillis(wall.toMillis()-86400000,{zone:timeZone}).offset, DateTime.fromMillis(wall.toMillis(),{zone:timeZone}).offset, DateTime.fromMillis(wall.toMillis()+86400000,{zone:timeZone}).offset]);
  const candidates = [...offsets].map(offset=>DateTime.fromMillis(wall.toMillis()-offset*60000,{zone:timeZone})).filter(v=>v.toFormat("yyyy-MM-dd'T'HH:mm")===localIso);
  if (!candidates.length) throw new DomainError('DST_GAP', 'Local time does not exist in this zone');
  if (candidates.length > 1 && requestedOffset === undefined) throw new DomainError('DST_AMBIGUOUS', 'Select the intended UTC offset');
  const selected = requestedOffset === undefined ? candidates[0] : candidates.find(v => v.offset === requestedOffset);
  if (!selected) throw new DomainError('DST_OFFSET', 'Offset is not valid for this local time');
  return { utc: selected.toUTC().toISO()!, offsetMinutes: selected.offset };
}
export class DomainError extends Error { constructor(public readonly code: string, message: string) { super(message); } }
