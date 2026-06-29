import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { mintServiceToken } from '../../apps/web/src/lib/service-token';

function decodePayload(token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

function verifySignature(token: string): boolean {
  const [header, body, sig] = token.split('.');
  const expected = crypto
    .createHmac('sha256', process.env.JWT_SECRET!)
    .update(`${header}.${body}`)
    .digest('base64url');
  return expected === sig;
}

describe('mintServiceToken', () => {
  const user = { id: 'user-1', email: 'alice@example.com', name: 'Alice', role: 'learner' };

  it('returns a three-part JWT string', () => {
    const token = mintServiceToken(user);
    expect(token.split('.')).toHaveLength(3);
  });

  it('includes the correct sub, email, name, and role', () => {
    const payload = decodePayload(mintServiceToken(user));
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('alice@example.com');
    expect(payload.name).toBe('Alice');
    expect(payload.role).toBe('learner');
  });

  it('sets expiry 60 seconds after issue', () => {
    const payload = decodePayload(mintServiceToken(user));
    expect(payload.exp - payload.iat).toBe(60);
  });

  it('produces a valid HS256 signature', () => {
    const token = mintServiceToken(user);
    expect(verifySignature(token)).toBe(true);
  });

  it('defaults role to "learner" when not provided', () => {
    const payload = decodePayload(mintServiceToken({ id: 'u2', email: null, name: null }));
    expect(payload.role).toBe('learner');
  });

  it('uses empty string for null email and name', () => {
    const payload = decodePayload(mintServiceToken({ id: 'u3', email: null, name: null }));
    expect(payload.email).toBe('');
    expect(payload.name).toBe('');
  });
});
