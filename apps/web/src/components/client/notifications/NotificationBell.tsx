'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification.store';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore(s => s.notifications);
  const unreadCount   = useNotificationStore(s => s.unreadCount);
  const markAllRead   = useNotificationStore(s => s.markAllRead);
  const markRead      = useNotificationStore(s => s.markRead);
  const clearAll      = useNotificationStore(s => s.clearAll);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typeColor = {
    info:    'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
  } as const;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-brand-500 hover:text-brand-700 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-gray-600"
                  title="Clear all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </li>
            ) : (
              notifications.map(n => (
                <li
                  key={n.id}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition ${!n.read ? 'font-medium' : 'text-gray-500'}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                    <div className={n.read ? 'ml-4' : ''}>
                      <p className="text-gray-900 leading-snug">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
