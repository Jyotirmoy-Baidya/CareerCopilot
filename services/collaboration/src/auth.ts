import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@careercopliot/types';

// Parse and verify a JWT from a WebSocket upgrade URL query string.
// y-websocket appends the encoded room name to the server URL, so the token
// query param may look like "TOKEN/note-UUID" — strip that suffix before verifying.
export function verifyWsToken(url: string): JWTPayload | null {
  try {
    const raw = new URL(url, 'ws://localhost').searchParams.get('token');
    if (!raw) return null;
    const token = raw.replace(/\/note-[a-f0-9-]{36}$/, '').replace(/\/$/, '');
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}

// Extract the noteId from the URL path: /collab/{noteId}
export function parseNoteId(url: string): string | null {
  const match = url.match(/\/collab\/([a-f0-9-]{36})/);
  return match?.[1] ?? null;
}
