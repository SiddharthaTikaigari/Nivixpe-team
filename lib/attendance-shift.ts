import { User, UserRole } from './auth';

const NIGHT_SHIFT_ROLES: UserRole[] = ['CMO', 'DCSO'];
export const NIGHT_SHIFT_START = '21:00'; // 9:00 PM

export function isNightShiftWorker(user: User | null): boolean {
  if (!user) return false;
  return NIGHT_SHIFT_ROLES.includes(user.role);
}

export function getAttendanceShiftNote(user: User | null): string | null {
  if (!isNightShiftWorker(user)) return null;
  return `Your primary shift starts at 9:00 PM. You may also mark attendance during the day if needed. Minimum 4 hours of work still applies.`;
}
