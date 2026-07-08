'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Textarea } from '@/src/components/ui/primitives';

type Handoff = {
  id: string;
  familyProfileId: string;
  outgoingCaregiverId: string | null;
  incomingCaregiverId: string | null;
  handoffDateTime: string;
  summary: string;
  completedTasks: string | null;
  pendingTasks: string | null;
  medicationNotes: string | null;
  appointmentNotes: string | null;
  generalNotes: string | null;
  acknowledgmentStatus: string;
  acknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function HandoffsPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [selected, setSelected] = useState<Handoff | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    familyProfileId: '',
    outgoingCaregiverId: '',
    incomingCaregiverId: '',
    handoffDateTime: '',
    summary: '',
    completedTasks: '',
    pendingTasks: '',
    medicationNotes: '',
    appointmentNotes: '',
    generalNotes: '',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const handoffRes = await fetch('/api/care-circle/handoffs');
      if (!handoffRes.ok) throw new Error('Unable to load handoffs');
      setHandoffs(await handoffRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load handoffs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return handoffs;
    return handoffs.filter((handoff) => handoff.acknowledgmentStatus === filter);
  }, [handoffs, filter]);

  const createHandoff = async () => {
    setError(null);
    const res = await fetch('/api/care-circle/handoffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error || 'Unable to create handoff');
      return;
    }
    setForm({
      familyProfileId: '',
      outgoingCaregiverId: '',
      incomingCaregiverId: '',
      handoffDateTime: '',
      summary: '',
      completedTasks: '',
      pendingTasks: '',
      medicationNotes: '',
      appointmentNotes: '',
      generalNotes: '',
    });
    await load();
  };

  const acknowledge = async (id: string) => {
    const res = await fetch(`/api/care-circle/handoffs/${id}`, { method: 'PATCH' });
    if (!res.ok) {
      setError((await res.json()).error || 'Unable to acknowledge');
      return;
    }
    await load();
  };

  if (loading) {
    return <DashboardShell><Card>Loading handoffs...</Card></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Care Circle</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Handoffs</h1>
          <p className="text-sm text-muted-foreground">User-entered observations only. No diagnosis or dosage changes.</p>
        </div>
        {error ? <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-sm text-red-300">{error}</div> : null}
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-3">
            <h2 className="text-lg font-bold">Create handoff</h2>
            <Input label="Target family profile" value={form.familyProfileId} onChange={(e) => setForm({ ...form, familyProfileId: e.target.value })} />
            <Input label="Outgoing caregiver" value={form.outgoingCaregiverId} onChange={(e) => setForm({ ...form, outgoingCaregiverId: e.target.value })} />
            <Input label="Incoming caregiver" value={form.incomingCaregiverId} onChange={(e) => setForm({ ...form, incomingCaregiverId: e.target.value })} />
            <Input label="Handoff date/time" type="datetime-local" value={form.handoffDateTime} onChange={(e) => setForm({ ...form, handoffDateTime: e.target.value })} />
            <Textarea label="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            <Textarea label="Completed tasks" value={form.completedTasks} onChange={(e) => setForm({ ...form, completedTasks: e.target.value })} />
            <Textarea label="Pending tasks" value={form.pendingTasks} onChange={(e) => setForm({ ...form, pendingTasks: e.target.value })} />
            <Textarea label="Medication observations" value={form.medicationNotes} onChange={(e) => setForm({ ...form, medicationNotes: e.target.value })} />
            <Textarea label="Appointment observations" value={form.appointmentNotes} onChange={(e) => setForm({ ...form, appointmentNotes: e.target.value })} />
            <Textarea label="General notes" value={form.generalNotes} onChange={(e) => setForm({ ...form, generalNotes: e.target.value })} />
            <Button onClick={() => void createHandoff()}>Create handoff</Button>
          </Card>
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">History</h2>
              <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            </div>
            <div className="space-y-3">
              {filtered.length ? filtered.map((handoff) => (
                <div key={handoff.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-semibold">{new Date(handoff.handoffDateTime).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{handoff.summary}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Outgoing: {handoff.outgoingCaregiverId || '—'} · Incoming: {handoff.incomingCaregiverId || '—'} · {handoff.acknowledgmentStatus}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setSelected(handoff)}>View</Button>
                      {handoff.acknowledgmentStatus !== 'acknowledged' ? <Button variant="secondary" size="sm" onClick={() => void acknowledge(handoff.id)}>Acknowledge</Button> : null}
                    </div>
                  </div>
                </div>
              )) : <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No handoffs yet.</div>}
            </div>
          </Card>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">Handoff detail</h3>
                <p className="text-sm text-muted-foreground">{new Date(selected.handoffDateTime).toLocaleString()}</p>
              </div>
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Card className="space-y-2">
                <div className="font-semibold">Observed summary</div>
                <p className="text-sm text-muted-foreground">{selected.summary}</p>
                <div className="text-xs text-muted-foreground">Created {new Date(selected.createdAt).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Status: {selected.acknowledgmentStatus}{selected.acknowledgedAt ? ` · Acked ${new Date(selected.acknowledgedAt).toLocaleString()}` : ''}</div>
              </Card>
              <Card className="space-y-2">
                <div className="font-semibold">Observations</div>
                <p className="text-sm"><span className="font-medium">Completed tasks:</span> {selected.completedTasks || '—'}</p>
                <p className="text-sm"><span className="font-medium">Pending tasks:</span> {selected.pendingTasks || '—'}</p>
                <p className="text-sm"><span className="font-medium">Medication observations:</span> {selected.medicationNotes || '—'}</p>
                <p className="text-sm"><span className="font-medium">Appointment observations:</span> {selected.appointmentNotes || '—'}</p>
                <p className="text-sm"><span className="font-medium">General notes:</span> {selected.generalNotes || '—'}</p>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
