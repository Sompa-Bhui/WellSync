'use client';

import React, { useEffect, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setItems(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {
        setItems([]);
        setUnreadCount(0);
      });
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Notification Center</p>
          <h1 className="mt-2 text-3xl font-bold">All reminders and alerts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Unread: {unreadCount}</p>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <article key={item.id} className={`rounded-xl border p-4 ${item.isRead ? 'border-border/50 bg-card' : 'border-primary/20 bg-primary/5'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
              </div>
            </article>
          ))}
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
