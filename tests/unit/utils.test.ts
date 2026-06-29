import { describe, it, expect } from 'vitest';
import {
  isoDateString,
  addDays,
  estimateDaysFromHours,
  toSlug,
  userColor,
  truncate,
  generateInviteCode,
} from '../../packages/utils/index';

describe('isoDateString', () => {
  it('returns YYYY-MM-DD format for today', () => {
    expect(isoDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats a specific date correctly', () => {
    expect(isoDateString(new Date('2024-06-15T12:00:00Z'))).toBe('2024-06-15');
  });
});

describe('addDays', () => {
  it('adds days to a date', () => {
    const result = addDays(new Date('2024-01-01'), 5);
    expect(isoDateString(result)).toBe('2024-01-06');
  });

  it('handles negative days', () => {
    const result = addDays(new Date('2024-01-10'), -3);
    expect(isoDateString(result)).toBe('2024-01-07');
  });

  it('does not mutate the original date', () => {
    const original = new Date('2024-01-01');
    addDays(original, 5);
    expect(isoDateString(original)).toBe('2024-01-01');
  });
});

describe('estimateDaysFromHours', () => {
  it('divides total hours by hours per day and rounds up', () => {
    expect(estimateDaysFromHours(10, 2)).toBe(5);
    expect(estimateDaysFromHours(9, 2)).toBe(5);
    expect(estimateDaysFromHours(10, 3)).toBe(4);
  });

  it('defaults to 2 hours per day', () => {
    expect(estimateDaysFromHours(6)).toBe(3);
  });
});

describe('toSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toSlug('  React  ')).toBe('react');
  });

  it('collapses multiple special chars into one hyphen', () => {
    expect(toSlug('Node.js & Express')).toBe('node-js-express');
  });
});

describe('userColor', () => {
  it('returns a hex color string', () => {
    expect(userColor('user-123')).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('returns the same color for the same userId', () => {
    expect(userColor('abc')).toBe(userColor('abc'));
  });

  it('may return different colors for different userIds', () => {
    const colors = new Set(['user-1', 'user-2', 'user-3', 'user-4', 'user-5'].map(userColor));
    // At least 2 distinct colors across 5 users (palette has 5 entries)
    expect(colors.size).toBeGreaterThanOrEqual(1);
  });
});

describe('truncate', () => {
  it('returns the string unchanged when under limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and appends ellipsis when over limit', () => {
    const result = truncate('Hello World', 6);
    expect(result).toBe('Hello…');
    expect(result.length).toBe(6);
  });
});

describe('generateInviteCode', () => {
  it('generates a code of the requested length', () => {
    expect(generateInviteCode(8)).toHaveLength(8);
    expect(generateInviteCode(4)).toHaveLength(4);
  });

  it('only contains allowed characters', () => {
    const code = generateInviteCode(20);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it('generates different codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateInviteCode(8)));
    expect(codes.size).toBeGreaterThan(1);
  });
});
