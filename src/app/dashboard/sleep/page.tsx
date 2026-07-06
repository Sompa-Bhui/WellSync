'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { Moon, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { formatMinutes } from '@/src/lib/date';

type SleepEntry = {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  qualityRating: number | null;
  interruptions: string | null;
  duration?: { hours: number; minutes: number };
};

export default function SleepPage() {
  const { activeProfile } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetHours, setTargetHours] = useState('8');
  const [form, setForm] = useState({ date: '', bedtime: '', wakeTime: '', qualityRating: '3', interruptions: '' });

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sleep?limit=30');
      if (!res.ok) throw new Error('Failed to load sleep');
      setEntries(await res.json());
    } catch {
      setError('We could not load sleep entries right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchEntries();
    })();
    return () => {
      cancelled = true;
    };
  }, [activeProfile]);

  const stats = useMemo(() => {
    const last7 = entries.slice(-7);
    const avg = last7.length ? last7.reduce((sum, e) => sum + e.durationMinutes, 0) / last7.length : 0;
    const quality = last7.filter((e) => e.qualityRating).reduce((sum, e) => sum + (e.qualityRating || 0), 0);
    return { avgMinutes: avg, avgQuality: last7.filter((e) => e.qualityRating).length ? quality / last7.filter((e) => e.qualityRating).length : 0 };
  }, [entries]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, qualityRating: form.qualityRating || null }),
    });
    if (res.ok) {
      setForm({ date: '', bedtime: '', wakeTime: '', qualityRating: '3', interruptions: '' });
      setEditingId(null);
      fetchEntries();
    }
  };

  const onEdit = (entry: SleepEntry) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      bedtime: new Date(entry.bedtime).toISOString().slice(0, 16),
      wakeTime: new Date(entry.wakeTime).toISOString().slice(0, 16),
      qualityRating: entry.qualityRating?.toString() || '',
      interruptions: entry.interruptions || '',
    });
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/sleep?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchEntries();
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Sleep Module</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Sleep Log</h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3"><div className="text-xs text-muted-foreground">7-day avg</div><div className="text-xl font-bold">{formatMinutes(Math.round(stats.avgMinutes)).hours}h {formatMinutes(Math.round(stats.avgMinutes)).minutes}m</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">Target</div><div className="text-xl font-bold">{targetHours}h</div></Card>
          </div>
        </div>

        <Card>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Target hours" type="number" value={targetHours} onChange={(e) => setTargetHours(e.target.value)} />
            <Input label="Bedtime" type="datetime-local" value={form.bedtime} onChange={(e) => setForm({ ...form, bedtime: e.target.value })} required />
            <Input label="Wake time" type="datetime-local" value={form.wakeTime} onChange={(e) => setForm({ ...form, wakeTime: e.target.value })} required />
            <Select label="Quality" options={[{ value: '', label: 'Optional' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }]} value={form.qualityRating} onChange={(e) => setForm({ ...form, qualityRating: e.target.value })} />
            <div className="md:col-span-2"><Textarea label="Interruptions / notes" value={form.interruptions} onChange={(e) => setForm({ ...form, interruptions: e.target.value })} /></div>
            <div className="md:col-span-2 flex justify-end"><Button type="submit">{editingId ? 'Update entry' : 'Save entry'}</Button></div>
          </form>
        </Card>

        {error && <Card className="border-red-900/40 bg-red-950/20 text-red-300">{error}</Card>}
        {loading ? <Card>Loading sleep history...</Card> : entries.length === 0 ? <Card>No sleep entries yet.</Card> : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2"><Moon className="h-4 w-4 text-primary" /><strong>{entry.date}</strong></div>
                  <div className="text-sm text-muted-foreground">{new Date(entry.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(entry.wakeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-sm">{entry.durationMinutes} minutes {entry.qualityRating ? `· quality ${entry.qualityRating}/5` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(entry)} leftIcon={<Edit3 className="h-4 w-4" />}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(entry.id)} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
