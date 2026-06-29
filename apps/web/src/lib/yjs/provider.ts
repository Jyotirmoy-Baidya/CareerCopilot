'use client';

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface YjsProviders {
  ydoc:          Y.Doc;
  wsProvider:    WebsocketProvider;
  localProvider: IndexeddbPersistence;
  destroy:       () => void;
}

export function createYjsProviders(noteId: string, token: string): YjsProviders {
  const ydoc = new Y.Doc();

  // Load from IndexedDB first — no network needed, instant open
  const localProvider = new IndexeddbPersistence(`note-${noteId}`, ydoc);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4004';
  const wsProvider = new WebsocketProvider(
    `${wsUrl}/collab/${noteId}?token=${token}`,
    `note-${noteId}`,
    ydoc,
    {
      connect:        typeof window !== 'undefined' ? navigator.onLine : false,
      resyncInterval: 5000,
    }
  );

  const handleOnline  = () => wsProvider.connect();
  const handleOffline = () => wsProvider.disconnect();

  if (typeof window !== 'undefined') {
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return {
    ydoc,
    wsProvider,
    localProvider,
    destroy: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online',  handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      wsProvider.destroy();
      localProvider.destroy();
      ydoc.destroy();
    },
  };
}
