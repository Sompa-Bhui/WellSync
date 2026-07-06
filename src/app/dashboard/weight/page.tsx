'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Textarea } from '@/src/components/ui/primitives';
import { Scale, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

type WeightEntry = { id: string; weight: number; date: string; notes: string | null; timestamp: string };

export default function WeightPage() {
  const { activeProfile } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [form, setForm] = useState({ weight: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    const res = await fetch('/api/weight?limit=90');
    if (res.ok) setEntries(await res.json());
    setLoading(false);
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

  const trends = useMemo(() => {
    const last7 = entries.slice(-7);
    const first = entries[0]?.weight;
    const last = entries[entries.length - 1]?.weight;
    return { avg: last7.length ? last7.reduce((sum, e) => sum + e.weight, 0) / last7.length : 0, delta: first && last ? last - first : 0 };
  }, [entries]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ weight: '', date: new Date().toISOString().slice(0, 10), notes: '' });
      fetchEntries();
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/weight?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchEntries();
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Weight Module</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Weight Trend</h1>
          </div>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">7-day average</div>
            <div className="text-xl font-bold">{trends.avg.toFixed(1)} kg</div>
          </Card>
        </div>

        <Card>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
            <Input label="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <div className="md:col-span-3"><Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="md:col-span-3 flex justify-end"><Button type="submit">Save weight</Button></div>
          </form>
        </Card>

        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /><span>Trend from first to latest entry</span></div>
          <strong>{trends.delta >= 0 ? '+' : ''}{trends.delta.toFixed(1)} kg</strong>
        </Card>

        {loading ? <Card>Loading weight history...</Card> : entries.length === 0 ? <Card>No weight entries yet.</Card> : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{entry.weight.toFixed(1)} kg</div>
                  <div className="text-sm text-muted-foreground">{entry.date}{entry.notes ? ` · ${entry.notes}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" leftIcon={<Edit3 className="h-4 w-4" />}>Edit</Button>
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
