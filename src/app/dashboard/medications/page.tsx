'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { Pill, Plus, ChevronRight } from 'lucide-react';

type Medication = {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  scheduleTimes: string;
  startDate: string;
  endDate: string | null;
  refillDate: string | null;
  instructions: string | null;
  reminderEnabled: boolean;
  active: boolean;
  medicationEvents?: MedicationEvent[];
};

type MedicationEvent = {
  id: string;
  scheduledTime: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED';
  timestamp: string | null;
  medication?: { name: string; dosage: string };
};

const blankForm = {
  name: '',
  dosage: '',
  unit: '',
  frequency: 'DAILY',
  scheduleTimes: '08:00',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  refillDate: '',
  instructions: '',
  reminderEnabled: true,
};

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/medications?includeEvents=1');
      if (!res.ok) throw new Error('load failed');
      setMedications(await res.json());
    } catch {
      setError('Unable to load medications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMedications();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMedications]);

  const active = medications.filter((m) => m.active);
  const inactive = medications.filter((m) => !m.active);

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = useMemo(() => {
    const events = medications.flatMap((m) => (m.medicationEvents || []).map((event) => ({ ...event, medication: { name: m.name, dosage: m.dosage } })));
    return events.filter((event) => event.scheduledTime.startsWith(today)).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medications, today]);

  const summary = useMemo(() => ({
    pending: todayEvents.filter((event) => event.status === 'PENDING').length,
    taken: todayEvents.filter((event) => event.status === 'TAKEN').length,
    skipped: todayEvents.filter((event) => event.status === 'SKIPPED').length,
    missed: todayEvents.filter((event) => event.status === 'MISSED').length,
  }), [todayEvents]);

  const nextDose = todayEvents.find((event) => event.status === 'PENDING');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(blankForm);
        setShowForm(false);
        await fetchMedications();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (eventId: string, status: 'TAKEN' | 'SKIPPED') => {
    await fetch(`/api/medications/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchMedications();
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Medication Module</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Medications</h1>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((value) => !value)}>
            Add medication
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Taken today</div><div className="text-2xl font-bold">{summary.taken}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Pending today</div><div className="text-2xl font-bold">{summary.pending}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Skipped today</div><div className="text-2xl font-bold">{summary.skipped}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Next dose</div><div className="text-lg font-bold">{nextDose ? new Date(nextDose.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'}</div></Card>
        </div>

        {showForm && (
          <Card>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Dosage" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required />
              <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
              <Select label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} options={[
                { value: 'DAILY', label: 'Daily' },
                { value: 'TWICE_DAILY', label: 'Twice Daily' },
                { value: 'THREE_TIMES_DAILY', label: 'Three Times Daily' },
                { value: 'WEEKLY', label: 'Weekly' },
                { value: 'AS_NEEDED', label: 'As Needed' },
                { value: 'CUSTOM', label: 'Custom' },
              ]} />
              <Input label="Schedule times" value={form.scheduleTimes} onChange={(e) => setForm({ ...form, scheduleTimes: e.target.value })} placeholder="08:00,20:00" required />
              <Input label="Start date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              <Input label="End date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              <Input label="Refill date" type="date" value={form.refillDate} onChange={(e) => setForm({ ...form, refillDate: e.target.value })} />
              <div className="md:col-span-3"><Textarea label="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-foreground md:col-span-3">
                <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })} />
                Reminders enabled
              </label>
              <div className="md:col-span-3 flex justify-end"><Button type="submit" isLoading={saving}>Save medication</Button></div>
            </form>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /><strong>Today&apos;s schedule</strong></div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Show inactive
              </label>
            </div>

            {loading ? <div className="py-6 text-sm text-muted-foreground">Loading medications...</div> : error ? <div className="py-6 text-sm text-red-300">{error}</div> : todayEvents.length === 0 ? <div className="py-6 text-sm text-muted-foreground">No schedule for today.</div> : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div key={event.id} className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">{new Date(event.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {event.medication?.name}</div>
                      <div className="text-sm text-muted-foreground">{event.medication?.dosage} · {event.status}</div>
                    </div>
                    {event.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(event.id, 'TAKEN')}>Mark taken</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(event.id, 'SKIPPED')}>Skip</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4"><strong>Upcoming doses</strong></div>
            <div className="space-y-3 text-sm">
              {nextDose ? (
                <div className="rounded-lg border border-border/60 bg-background p-3">
                  <div className="font-semibold">{nextDose.medication?.name}</div>
                  <div className="text-muted-foreground">{new Date(nextDose.scheduledTime).toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-muted-foreground">No pending doses.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 font-semibold">Active medications</div>
            <div className="space-y-3">
              {(showInactive ? medications : active).map((medication) => (
                <Link key={medication.id} href={`/dashboard/medications/${medication.id}`} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 hover:border-primary/40">
                  <div>
                    <div className="font-semibold">{medication.name}</div>
                    <div className="text-sm text-muted-foreground">{medication.dosage} · {medication.scheduleTimes}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 font-semibold">Inactive medications</div>
            <div className="space-y-3">
              {inactive.length === 0 ? <div className="text-sm text-muted-foreground">No inactive medications.</div> : inactive.map((medication) => (
                <Link key={medication.id} href={`/dashboard/medications/${medication.id}`} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 hover:border-primary/40">
                  <div>
                    <div className="font-semibold">{medication.name}</div>
                    <div className="text-sm text-muted-foreground">{medication.dosage} · inactive</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
