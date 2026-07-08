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
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customScheduledAt, setCustomScheduledAt] = useState('');
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createCustomReminder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingReminder(true);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          description: customDescription,
          scheduledAt: customScheduledAt,
          reminderType: 'CUSTOM',
          sourceType: 'CUSTOM',
        }),
      });
      if (!response.ok) return;
      setCustomTitle('');
      setCustomDescription('');
      setCustomScheduledAt('');
      const refreshed = await fetch('/api/notifications');
      const data = await refreshed.json();
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } finally {
      setSavingReminder(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Notification Center</p>
          <h1 className="mt-2 text-3xl font-bold">All reminders and alerts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Unread: {unreadCount}</p>
        </div>

        <form onSubmit={createCustomReminder} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Custom reminder</p>
            <h2 className="mt-2 text-xl font-semibold">Create a personal health reminder</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Title</span>
              <input
                className="rounded-lg border border-border/80 bg-background px-3 py-2 text-sm"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Schedule time</span>
              <input
                type="datetime-local"
                className="rounded-lg border border-border/80 bg-background px-3 py-2 text-sm"
                value={customScheduledAt}
                onChange={(e) => setCustomScheduledAt(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-1">
              <span className="font-medium">Description</span>
              <input
                className="rounded-lg border border-border/80 bg-background px-3 py-2 text-sm"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={savingReminder}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {savingReminder ? 'Saving...' : 'Add reminder'}
          </button>
        </form>

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
