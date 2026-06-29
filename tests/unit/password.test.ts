import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../services/auth/src/utils/password';

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
  });

  it('does not store the plain-text password', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).not.toBe('mypassword');
    expect(hash).not.toContain('mypassword');
  });

  it('produces a different hash each call (random salt)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});

describe('comparePassword', () => {
  it('returns true when the plain text matches the hash', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await comparePassword('correct-horse', hash)).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await comparePassword('wrong-guess', hash)).toBe(false);
  });

  it('returns false for an empty string against a real hash', async () => {
    const hash = await hashPassword('non-empty');
    expect(await comparePassword('', hash)).toBe(false);
  });
});
