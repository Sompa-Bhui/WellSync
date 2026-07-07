'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Textarea } from '@/src/components/ui/primitives';
import { ArrowLeft, CheckCircle2, CalendarClock, ClipboardList, Plus, RotateCcw, XCircle } from 'lucide-react';

type Appointment = {
  id: string;
  doctor: { id: string; name: string; specialty: string; clinic: string; contactInfo: string | null };
  date: string;
  time: string;
  isVirtual: boolean;
  status: string;
  reason: string | null;
  notes: string | null;
  preparationList: string[];
  followUpDate: string | null;
  medicalRecords: Array<{ id: string; title: string; date: string; category: string }>;
};

type FollowUp = {
  id: string;
  title: string;
  details: string | null;
  dueDate: string;
  status: string;
  scheduledAppointmentId: string | null;
};

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({ title: '', details: '', dueDate: new Date().toISOString().slice(0, 10) });
  const [reschedule, setReschedule] = useState({ date: new Date().toISOString().slice(0, 10), time: '09:00' });
  const [notes, setNotes] = useState('');
  const [linkedRecordId, setLinkedRecordId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentRes, followUpsRes] = await Promise.all([
        fetch(`/api/appointments/${params.id}`),
        fetch(`/api/appointments/${params.id}/follow-ups`),
      ]);
      if (appointmentRes.ok) {
        const data = await appointmentRes.json();
        setAppointment(data);
        setNotes(data.notes || '');
      }
      if (followUpsRes.ok) {
        setFollowUps(await followUpsRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const mutate = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetch(`/api/appointments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await fetchData();
      setRescheduleOpen(false);
      setCancelOpen(false);
      setCompleteOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const createFollowUp = async () => {
    setSaving(true);
    try {
      await fetch(`/api/appointments/${params.id}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFollowUp),
      });
      setNewFollowUp({ title: '', details: '', dueDate: new Date().toISOString().slice(0, 10) });
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const scheduleFollowUp = async (followUpId: string) => {
    if (!appointment) return;
    setSaving(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: appointment.doctor.id,
          date: new Date().toISOString().slice(0, 10),
          time: '09:00',
          status: 'PENDING',
          reason: `Follow-up for ${appointment.doctor.name}`,
          notes: 'Scheduled from follow-up',
          preparationList: ['Bring prior records', 'Review follow-up questions'],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetch(`/api/appointments/${params.id}/follow-ups`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followUpId, status: 'scheduled', scheduledAppointmentId: created.id }),
        });
        await fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const linkRecord = async () => {
    if (!linkedRecordId) return;
    await fetch(`/api/records/${linkedRecordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: params.id }),
    });
    setLinkedRecordId('');
    await fetchData();
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Link href="/dashboard/appointments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to appointments
        </Link>

        {loading || !appointment ? <Card><div className="py-8 text-sm text-muted-foreground">Loading appointment details...</div></Card> : (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Appointment detail</p>
                    <h1 className="mt-1 text-3xl font-extrabold">{appointment.doctor.name}</h1>
                    <p className="text-sm text-muted-foreground">{appointment.doctor.specialty} · {appointment.doctor.clinic}</p>
                  </div>
                  <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-bold uppercase tracking-wider">{appointment.status}</span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">When</div>
                    <div className="mt-1 font-semibold">{appointment.date} at {appointment.time}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">Mode</div>
                    <div className="mt-1 font-semibold">{appointment.isVirtual ? 'Virtual' : 'In person'}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">Reason</div>
                    <div className="mt-1 font-semibold">{appointment.reason || 'Not specified'}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">Contact</div>
                    <div className="mt-1 font-semibold">{appointment.doctor.contactInfo || 'Unavailable'}</div>
                  </Card>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setRescheduleOpen((v) => !v)}>Reschedule</Button>
                  <Button variant="outline" leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setCompleteOpen((v) => !v)}>Complete visit</Button>
                  <Button variant="danger" leftIcon={<XCircle className="h-4 w-4" />} onClick={() => setCancelOpen((v) => !v)}>Cancel</Button>
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary" /> Preparation</div>
                <div className="space-y-2 text-sm">
                  {(appointment.preparationList || []).length > 0 ? appointment.preparationList.map((item) => <div key={item}>• {item}</div>) : <div className="text-muted-foreground">No preparation list set.</div>}
                </div>
              </Card>
            </div>

            {rescheduleOpen && (
              <Card>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="New date" type="date" value={reschedule.date} onChange={(e) => setReschedule({ ...reschedule, date: e.target.value })} />
                  <Input label="New time" type="time" value={reschedule.time} onChange={(e) => setReschedule({ ...reschedule, time: e.target.value })} />
                  <div className="flex items-end"><Button isLoading={saving} onClick={() => mutate({ action: 'reschedule', ...reschedule, notes })}>Save reschedule</Button></div>
                </div>
              </Card>
            )}

            {completeOpen && (
              <Card>
                <div className="space-y-4">
                  <Textarea label="Visit notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <div className="flex justify-end"><Button isLoading={saving} onClick={() => mutate({ action: 'complete', notes })}>Mark complete</Button></div>
                </div>
              </Card>
            )}

            {cancelOpen && (
              <Card>
                <div className="space-y-4">
                  <Textarea label="Cancellation notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <div className="flex justify-end"><Button variant="danger" isLoading={saving} onClick={() => mutate({ action: 'cancel', notes })}>Confirm cancellation</Button></div>
                </div>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4 text-primary" /> Follow-ups</div>
                <div className="space-y-3">
                  {followUps.length > 0 ? followUps.map((followUp) => (
                    <div key={followUp.id} className="rounded-lg border border-border/60 bg-background p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{followUp.title}</div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{followUp.status}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{followUp.details || 'No details'}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Due {followUp.dueDate}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => fetch(`/api/appointments/${params.id}/follow-ups`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ followUpId: followUp.id, status: 'completed' }),
                        }).then(() => fetchData())}>Complete</Button>
                        <Button size="sm" variant="ghost" onClick={() => fetch(`/api/appointments/${params.id}/follow-ups`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ followUpId: followUp.id, status: 'dismissed' }),
                        }).then(() => fetchData())}>Dismiss</Button>
                        <Button size="sm" variant="outline" onClick={() => scheduleFollowUp(followUp.id)}>Schedule appointment</Button>
                      </div>
                    </div>
                  )) : <div className="text-sm text-muted-foreground">No follow-ups yet.</div>}
                </div>
                <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
                  <Input label="Title" value={newFollowUp.title} onChange={(e) => setNewFollowUp({ ...newFollowUp, title: e.target.value })} />
                  <Input label="Due date" type="date" value={newFollowUp.dueDate} onChange={(e) => setNewFollowUp({ ...newFollowUp, dueDate: e.target.value })} />
                  <Textarea label="Details" value={newFollowUp.details} onChange={(e) => setNewFollowUp({ ...newFollowUp, details: e.target.value })} />
                  <div className="flex justify-end"><Button leftIcon={<Plus className="h-4 w-4" />} isLoading={saving} onClick={createFollowUp}>Add follow-up</Button></div>
                </div>
              </Card>

              <Card>
                <div className="mb-4 font-semibold">Post-visit records</div>
                <div className="space-y-3">
                  {appointment.medicalRecords.length > 0 ? appointment.medicalRecords.map((record) => (
                    <div key={record.id} className="rounded-lg border border-border/60 bg-background p-3">
                      <div className="font-semibold">{record.title}</div>
                      <div className="text-sm text-muted-foreground">{record.category} · {record.date}</div>
                    </div>
                  )) : <div className="text-sm text-muted-foreground">No post-visit records connected yet.</div>}
                </div>
                <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
                  <Input label="Link record ID" value={linkedRecordId} onChange={(e) => setLinkedRecordId(e.target.value)} placeholder="Paste a record ID" />
                  <div className="flex justify-end"><Button variant="secondary" onClick={linkRecord}>Link record</Button></div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
