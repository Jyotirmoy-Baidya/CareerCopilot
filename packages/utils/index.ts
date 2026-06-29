// Shared utility helpers

export function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function isoDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function estimateDaysFromHours(totalHours: number, hoursPerDay = 2): number {
  return Math.ceil(totalHours / hoursPerDay);
}

// Simple slug from a display name
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Deterministic color from a user ID — used for collaboration cursors
export function userColor(userId: string): string {
  const palette = ['#1D9E75', '#534AB7', '#D85A30', '#185FA5', '#BA7517'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

// Truncate a string for display
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
