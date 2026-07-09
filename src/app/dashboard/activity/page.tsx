'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { Activity, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

type ActivityEntry = {
  id: string;
  type: string;
  durationMinutes: number;
  distance: number | null;
  steps: number | null;
  notes: string | null;
  date: string;
  timestamp: string;
};

export default function ActivityPage() {
  const { activeProfile } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'WALKING', durationMinutes: '', distance: '', steps: '', notes: '', date: new Date().toISOString().slice(0, 10), timestamp: '' });

  const combineDateAndTime = (date: string, time: string) => {
    if (!date || !time) return '';
    const [hours, minutes] = time.split(':');
    const value = new Date(`${date}T00:00:00`);
    value.setHours(Number(hours), Number(minutes), 0, 0);
    return value.toISOString();
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/activity?limit=60');
      if (!res.ok) throw new Error('failed');
      setEntries(await res.json());
    } catch {
      setError('Unable to load activity history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEntries, activeProfile]);

  const stats = useMemo(() => {
    const last7 = entries.slice(-7);
    return {
      duration: last7.reduce((sum, entry) => sum + entry.durationMinutes, 0),
      steps: last7.reduce((sum, entry) => sum + (entry.steps || 0), 0),
      today: entries.filter((entry) => entry.date === new Date().toISOString().split('T')[0]),
    };
  }, [entries]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      distance: form.distance || null,
      steps: form.steps || null,
      timestamp: form.timestamp ? combineDateAndTime(form.date, form.timestamp) : undefined,
    };
    const res = await fetch(editingId ? `/api/activity/${editingId}` : '/api/activity', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm({ type: 'WALKING', durationMinutes: '', distance: '', steps: '', notes: '', date: new Date().toISOString().slice(0, 10), timestamp: '' });
      setEditingId(null);
      fetchEntries();
    }
  };

  const edit = (entry: ActivityEntry) => {
    setEditingId(entry.id);
    setForm({
      type: entry.type,
      durationMinutes: String(entry.durationMinutes),
      distance: entry.distance ? String(entry.distance) : '',
      steps: entry.steps ? String(entry.steps) : '',
      notes: entry.notes || '',
      date: entry.date,
      timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString().slice(11, 16) : '',
    });
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/activity/${id}`, { method: 'DELETE' });
    if (res.ok) fetchEntries();
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Activity Module</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Activity</h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3"><div className="text-xs text-muted-foreground">7-day duration</div><div className="text-xl font-bold">{stats.duration} min</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">7-day steps</div><div className="text-xl font-bold">{stats.steps.toLocaleString()}</div></Card>
          </div>
        </div>

        <Card>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[
              { value: 'WALKING', label: 'Walking' },
              { value: 'RUNNING', label: 'Running' },
              { value: 'CYCLING', label: 'Cycling' },
              { value: 'STRENGTH', label: 'Strength Training' },
              { value: 'YOGA', label: 'Yoga' },
              { value: 'CUSTOM', label: 'Custom' },
            ]} />
            <Input label="Duration (min)" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Distance (km)" type="number" step="0.1" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
            <Input label="Steps" type="number" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
            <Input label="Time" type="time" value={form.timestamp} onChange={(e) => setForm({ ...form, timestamp: e.target.value })} />
            <div className="md:col-span-3"><Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="md:col-span-3 flex justify-end"><Button type="submit">{editingId ? 'Update activity' : 'Add activity'}</Button></div>
          </form>
        </Card>

        {error && <Card className="border-red-900/40 bg-red-950/20 text-red-300">{error}</Card>}
        {loading ? <Card>Loading activity history...</Card> : entries.length === 0 ? <Card>No activities logged yet.</Card> : (
          <div className="grid gap-4">
            <Card>
              <div className="flex items-center gap-2 mb-4"><Activity className="h-5 w-5 text-primary" /><strong>Today&apos;s activity</strong></div>
              <div className="text-sm text-muted-foreground">{stats.today.length} entries today</div>
            </Card>
            {entries.map((entry) => (
              <Card key={entry.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{entry.type} · {entry.durationMinutes} min</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.date}
                    {entry.distance ? ` · ${entry.distance} km` : ''}
                    {entry.steps ? ` · ${entry.steps} steps` : ''}
                  </div>
                  {entry.notes && <div className="text-sm text-muted-foreground">{entry.notes}</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" leftIcon={<Edit3 className="h-4 w-4" />} onClick={() => edit(entry)}>Edit</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => remove(entry.id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
