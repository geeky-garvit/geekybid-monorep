'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  notify: (title: string, detail: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const notify = useCallback((title: string, detail: string) => {
    setNotifications((current) => [
      {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        detail,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...current,
    ].slice(0, 30));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) =>
      current.map((item) => (item.read ? item : { ...item, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      notify,
      markAllRead,
      clearNotifications,
    }),
    [notifications, unreadCount, notify, markAllRead, clearNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}