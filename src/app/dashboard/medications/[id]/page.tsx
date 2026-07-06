'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { useParams } from 'next/navigation';

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
  medicationEvents: MedicationEvent[];
};

type MedicationEvent = {
  id: string;
  scheduledTime: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED';
  timestamp: string | null;
};

export default function MedicationDetailPage() {
  const params = useParams<{ id: string }>();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dosage: '',
    unit: '',
    frequency: 'DAILY',
    scheduleTimes: '',
    startDate: '',
    endDate: '',
    refillDate: '',
    instructions: '',
    reminderEnabled: true,
    active: true,
  });

  const fetchMedication = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/medications/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setMedication(data);
      setForm({
        name: data.name,
        dosage: data.dosage,
        unit: data.unit,
        frequency: data.frequency,
        scheduleTimes: data.scheduleTimes,
        startDate: data.startDate,
        endDate: data.endDate || '',
        refillDate: data.refillDate || '',
        instructions: data.instructions || '',
        reminderEnabled: data.reminderEnabled,
        active: data.active,
      });
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMedication();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMedication]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/medications/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    await fetchMedication();
    setSaving(false);
  };

  const toggleActive = async () => {
    await fetch(`/api/medications/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !medication?.active }),
    });
    await fetchMedication();
  };

  const updateEvent = async (eventId: string, status: 'TAKEN' | 'SKIPPED') => {
    await fetch(`/api/medications/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchMedication();
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Medication Detail</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{medication?.name || 'Medication'}</h1>
        </div>

        {loading ? <Card>Loading medication...</Card> : medication ? (
          <>
            <Card>
              <form className="grid gap-4 md:grid-cols-3" onSubmit={save}>
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
                <Input label="Schedule times" value={form.scheduleTimes} onChange={(e) => setForm({ ...form, scheduleTimes: e.target.value })} />
                <Input label="Start date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                <Input label="End date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                <Input label="Refill date" type="date" value={form.refillDate} onChange={(e) => setForm({ ...form, refillDate: e.target.value })} />
                <div className="md:col-span-3"><Textarea label="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
                <label className="flex items-center gap-2 text-sm md:col-span-3">
                  <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })} />
                  Reminders enabled
                </label>
                <label className="flex items-center gap-2 text-sm md:col-span-3">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Active medication
                </label>
                <div className="md:col-span-3 flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={toggleActive}>{medication.active ? 'Deactivate' : 'Activate'}</Button>
                  <Button type="submit" isLoading={saving}>Save changes</Button>
                </div>
              </form>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="mb-4 font-semibold">Recent adherence events</div>
                <div className="space-y-3">
                  {medication.medicationEvents.length === 0 ? <div className="text-sm text-muted-foreground">No medication events recorded yet.</div> : medication.medicationEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3">
                      <div>
                        <div className="font-semibold">{new Date(event.scheduledTime).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{event.status}</div>
                      </div>
                      <div className="flex gap-2">
                        {event.status === 'PENDING' && <>
                          <Button size="sm" variant="secondary" onClick={() => updateEvent(event.id, 'TAKEN')}>Taken</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateEvent(event.id, 'SKIPPED')}>Skip</Button>
                        </>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-4 font-semibold">Medication summary</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Frequency: {medication.frequency}</div>
                  <div>Schedule: {medication.scheduleTimes}</div>
                  <div>Start: {medication.startDate}</div>
                  <div>End: {medication.endDate || 'Not set'}</div>
                  <div>Refill: {medication.refillDate || 'Not set'}</div>
                  <div>Reminder: {medication.reminderEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </Card>
            </div>
          </>
        ) : <Card>Medication not found.</Card>}
      </div>
    </DashboardShell>
  );
}
