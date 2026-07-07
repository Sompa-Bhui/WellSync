'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { Plus, Search, FileText } from 'lucide-react';

type RecordItem = {
  id: string;
  title: string;
  category: string;
  provider: string;
  date: string;
  fileUrl: string;
  notes: string | null;
  tags: string | null;
  appointmentId: string | null;
  appointment?: { id: string; doctor: { name: string } };
};

const blank = {
  title: '',
  category: 'OTHER',
  provider: '',
  date: new Date().toISOString().slice(0, 10),
  fileUrl: '/records/metadata-only',
  notes: '',
  tags: '',
  appointmentId: '',
};

export default function RecordsPage() {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/records?q=${encodeURIComponent(query)}&category=${category}`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setError('Unable to load records.');
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItems();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const filtered = useMemo(() => items, [items]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setForm(blank);
        setShowForm(false);
        await fetchItems();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Medical archive</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Records Vault</h1>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>New record</Button>
        </div>

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records" />
            </div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} options={[
              { value: 'all', label: 'All types' },
              { value: 'PRESCRIPTION', label: 'Prescription' },
              { value: 'LAB_REPORT', label: 'Lab report' },
              { value: 'IMAGING', label: 'Imaging' },
              { value: 'DISCHARGE_SUMMARY', label: 'Discharge summary' },
              { value: 'VACCINATION', label: 'Vaccination' },
              { value: 'OTHER', label: 'Custom' },
            ]} />
          </div>
        </Card>

        {showForm && (
          <Card>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={[
                { value: 'PRESCRIPTION', label: 'Prescription' },
                { value: 'LAB_REPORT', label: 'Lab report' },
                { value: 'IMAGING', label: 'Imaging' },
                { value: 'DISCHARGE_SUMMARY', label: 'Discharge summary' },
                { value: 'VACCINATION', label: 'Vaccination' },
                { value: 'OTHER', label: 'Custom' },
              ]} />
              <Input label="Provider / clinic" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} required />
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <Input label="File URL" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
              <Input label="Appointment ID" value={form.appointmentId} onChange={(e) => setForm({ ...form, appointmentId: e.target.value })} />
              <div className="md:col-span-2"><Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="md:col-span-2"><Textarea label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
              <div className="md:col-span-2 flex justify-end"><Button isLoading={saving} type="submit">Save record</Button></div>
            </form>
          </Card>
        )}

        <Card>
          {loading ? <div className="py-8 text-sm text-muted-foreground">Loading records...</div> : error ? <div className="py-8 text-sm text-red-300">{error}</div> : filtered.length === 0 ? <div className="py-8 text-sm text-muted-foreground">No records found.</div> : (
            <div className="space-y-3">
              {filtered.map((record) => (
                <Link key={record.id} href={`/dashboard/records/${record.id}`} className="block rounded-lg border border-border/60 bg-background p-4 hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{record.title}</div>
                      <div className="text-sm text-muted-foreground">{record.category} · {record.provider}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{record.date}{record.appointment?.doctor?.name ? ` · linked to ${record.appointment.doctor.name}` : ''}</div>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
