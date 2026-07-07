'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { CalendarDays, CheckCircle2, Clock3, Plus, Search, XCircle } from 'lucide-react';

type Appointment = {
  id: string;
  doctor: { id: string; name: string; specialty: string; clinic: string; contactInfo: string | null };
  date: string;
  time: string;
  isVirtual: boolean;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'MISSED';
  reason: string | null;
  notes: string | null;
  preparationList: string[] | string | null;
  followUpDate: string | null;
  medicalRecords?: Array<{ id: string; title: string }>;
};

const blankForm = {
  doctorName: '',
  specialty: '',
  clinic: '',
  contactInfo: '',
  date: new Date().toISOString().slice(0, 10),
  time: '09:00',
  isVirtual: false,
  status: 'PENDING',
  reason: '',
  notes: '',
  preparationList: 'Bring reports, Arrive 15 minutes early',
  followUpDate: '',
};

function formatTime(value: string) {
  return new Date(`2000-01-01T${value}:00Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState(blankForm);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments?status=${status}`);
      if (!res.ok) throw new Error();
      setAppointments(await res.json());
    } catch {
      setError('Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAppointments();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  const filtered = useMemo(() => {
    return appointments.filter((appointment) => {
      const haystack = `${appointment.doctor.name} ${appointment.doctor.specialty} ${appointment.doctor.clinic} ${appointment.reason || ''}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [appointments, query]);

  const upcoming = filtered.filter((appointment) => ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(appointment.status));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          preparationList: form.preparationList.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setForm(blankForm);
        setShowForm(false);
        await fetchAppointments();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Clinical Schedule</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Appointments</h1>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>
            New appointment
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Upcoming</div><div className="text-2xl font-bold">{upcoming.length}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Completed</div><div className="text-2xl font-bold">{filtered.filter((a) => a.status === 'COMPLETED').length}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Cancelled</div><div className="text-2xl font-bold">{filtered.filter((a) => a.status === 'CANCELLED').length}</div></Card>
        </div>

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctor, specialty, clinic, reason" className="pl-9" />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[
              { value: 'all', label: 'All statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'RESCHEDULED', label: 'Rescheduled' },
              { value: 'MISSED', label: 'Missed' },
            ]} />
          </div>
        </Card>

        {showForm && (
          <Card>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <Input label="Doctor name" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} required />
              <Input label="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required />
              <Input label="Clinic" value={form.clinic} onChange={(e) => setForm({ ...form, clinic: e.target.value })} required />
              <Input label="Contact info" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} />
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'RESCHEDULED', label: 'Rescheduled' },
                { value: 'MISSED', label: 'Missed' },
              ]} />
              <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
                <input type="checkbox" checked={form.isVirtual} onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })} />
                Virtual visit
              </label>
              <Input label="Follow-up date" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
              <div />
              <div className="md:col-span-2"><Textarea label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <div className="md:col-span-2"><Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="md:col-span-2"><Textarea label="Preparation list" value={form.preparationList} onChange={(e) => setForm({ ...form, preparationList: e.target.value })} /></div>
              <div className="md:col-span-2 flex justify-end"><Button type="submit" isLoading={saving}>Save appointment</Button></div>
            </form>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><strong>Schedule</strong></div>
              <span className="text-xs text-muted-foreground">{filtered.length} total</span>
            </div>

            {loading ? <div className="py-8 text-sm text-muted-foreground">Loading appointments...</div> : error ? <div className="py-8 text-sm text-red-300">{error}</div> : filtered.length === 0 ? <div className="py-8 text-sm text-muted-foreground">No appointments found.</div> : (
              <div className="space-y-3">
                {filtered.map((appointment) => (
                  <Link key={appointment.id} href={`/dashboard/appointments/${appointment.id}`} className="block rounded-lg border border-border/60 bg-background p-4 transition hover:border-primary/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold">{appointment.doctor.name}</div>
                        <div className="text-sm text-muted-foreground">{appointment.doctor.specialty} · {appointment.doctor.clinic}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {appointment.date} at {formatTime(appointment.time)} {appointment.isVirtual ? '· Virtual' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">{appointment.status}</span>
                        {appointment.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4 text-success" /> : appointment.status === 'CANCELLED' ? <XCircle className="h-4 w-4 text-destructive" /> : <Clock3 className="h-4 w-4 text-warning" />}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 font-semibold">Preparation checklist</div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Confirm documents, prescriptions, and recent reports.</p>
              <p>• Arrive 15 minutes early or join the virtual room on time.</p>
              <p>• Keep follow-up questions and symptoms notes ready.</p>
              <p>• Review medication changes after the visit.</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
