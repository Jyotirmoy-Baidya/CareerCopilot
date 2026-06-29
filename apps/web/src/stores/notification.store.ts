import { create } from 'zustand';

export interface AppNotification {
  id:        string;
  type:      'info' | 'success' | 'warning';
  title:     string;
  body?:     string;
  href?:     string;
  createdAt: Date;
  read:      boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount:   number;

  addNotification:  (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead:      () => void;
  markRead:         (id: string) => void;
  clearAll:         () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount:   0,

  addNotification: (n) => {
    const notification: AppNotification = {
      ...n,
      id:        crypto.randomUUID(),
      createdAt: new Date(),
      read:      false,
    };
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount:   state.unreadCount + 1,
    }));
  },

  markRead: (id) => {
    set(state => {
      const notifications = state.notifications.map(n =>
        n.id === id && !n.read ? { ...n, read: true } : n
      );
      return { notifications, unreadCount: Math.max(0, state.unreadCount - 1) };
    });
  },

  markAllRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
