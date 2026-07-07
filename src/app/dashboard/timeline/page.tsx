'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import { Clock3, ChevronDown } from 'lucide-react';

type TimelineEvent = {
  id: string;
  eventType: string;
  eventId: string | null;
  title: string;
  description: string;
  timestamp: string;
};

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventType, setEventType] = useState('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchItems = useCallback(async (reset = true) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ eventType, take: '20' });
      if (!reset && cursor) params.set('cursor', cursor);
      const res = await fetch(`/api/timeline?${params.toString()}`);
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setNextCursor(data.nextCursor);
      if (reset) setCursor(null);
    } catch {
      setError('Unable to load timeline.');
    } finally {
      setLoading(false);
    }
  }, [cursor, eventType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItems(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const grouped = useMemo(() => items, [items]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Connected history</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Timeline</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={eventType} onChange={(e) => setEventType(e.target.value)} options={[
              { value: 'all', label: 'All events' },
              { value: 'APPOINTMENT', label: 'Appointments' },
              { value: 'FOLLOW_UP', label: 'Follow-ups' },
              { value: 'MEDICATION', label: 'Medication' },
              { value: 'WEIGHT', label: 'Weight' },
              { value: 'PRESCRIPTION', label: 'Prescriptions' },
              { value: 'LAB_REPORT', label: 'Lab reports' },
              { value: 'IMAGING', label: 'Imaging' },
              { value: 'RECORD', label: 'Records' },
            ]} />
            <Button variant="secondary" onClick={() => void fetchItems(true)}>Refresh</Button>
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading timeline...</div>
          ) : error ? (
            <div className="py-8 text-sm text-red-300">{error}</div>
          ) : grouped.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">No timeline events yet.</div>
          ) : (
            <div className="space-y-3">
              {grouped.map((event) => (
                <div key={event.id} className="rounded-lg border border-border/60 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{event.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{event.description}</div>
                    </div>
                    <span className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">{event.eventType}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {nextCursor && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                leftIcon={<ChevronDown className="h-4 w-4" />}
                onClick={() => {
                  setCursor(nextCursor);
                  void fetchItems(false);
                }}
              >
                Load more
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
