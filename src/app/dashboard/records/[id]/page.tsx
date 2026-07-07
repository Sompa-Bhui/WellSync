'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Textarea } from '@/src/components/ui/primitives';
import { ArrowLeft, Trash2 } from 'lucide-react';

type RecordDetail = {
  id: string;
  title: string;
  category: string;
  provider: string;
  date: string;
  fileUrl: string;
  notes: string | null;
  tags: string | null;
  appointment?: { id: string; doctor: { name: string; specialty: string } } | null;
};

export default function RecordDetailPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/records/${params.id}`);
      if (res.ok) setRecord(await res.json());
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRecord();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRecord]);

  const update = async (data: Partial<RecordDetail>) => {
    setSaving(true);
    try {
      await fetch(`/api/records/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchRecord();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await fetch(`/api/records/${params.id}`, { method: 'DELETE' });
      history.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Link href="/dashboard/records" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to records
        </Link>

        {loading || !record ? <Card><div className="py-8 text-sm text-muted-foreground">Loading record...</div></Card> : (
          <>
            <Card>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Record detail</p>
                  <h1 className="text-3xl font-extrabold">{record.title}</h1>
                  <p className="text-sm text-muted-foreground">{record.category} · {record.provider}</p>
                </div>
                <span className="text-xs text-muted-foreground">{record.date}</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Input label="Title" defaultValue={record.title} onBlur={(e) => update({ title: e.target.value })} />
                <Input label="Provider" defaultValue={record.provider} onBlur={(e) => update({ provider: e.target.value })} />
                <Input label="Date" type="date" defaultValue={record.date} onBlur={(e) => update({ date: e.target.value })} />
                <Input label="File URL" defaultValue={record.fileUrl} onBlur={(e) => update({ fileUrl: e.target.value })} />
                <div className="md:col-span-2"><Textarea label="Notes" defaultValue={record.notes || ''} onBlur={(e) => update({ notes: e.target.value })} /></div>
                <div className="md:col-span-2"><Input label="Tags" defaultValue={record.tags || ''} onBlur={(e) => update({ tags: e.target.value })} /></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button isLoading={saving} onClick={() => setConfirmDelete((v) => !v)} variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>Delete record</Button>
              </div>
            </Card>

            {confirmDelete && (
              <Card>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">This record will be permanently deleted.</p>
                  <div className="flex gap-3">
                    <Button variant="danger" isLoading={saving} onClick={remove}>Confirm delete</Button>
                    <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <div className="font-semibold">Linked appointment</div>
              {record.appointment ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  {record.appointment.doctor.name} · {record.appointment.doctor.specialty}
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">No linked appointment.</div>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
