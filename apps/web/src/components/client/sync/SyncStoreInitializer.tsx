'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSyncStore } from '@/stores/sync.store';

export function SyncStoreInitializer() {
  const { data: session } = useSession();
  const { setOffline, flushQueue, refreshCount } = useSyncStore();

  // Mirror browser online/offline events into the store
  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, [setOffline]);

  // Flush on reconnect
  useEffect(() => {
    if (!session?.accessToken) return;
    const onOnline = () => flushQueue(session.accessToken);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [session?.accessToken, flushQueue]);

  // Flush on mount and poll pending count
  useEffect(() => {
    if (!session?.accessToken) return;
    if (navigator.onLine) flushQueue(session.accessToken);

    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, [session?.accessToken, flushQueue, refreshCount]);

  return null;
}
