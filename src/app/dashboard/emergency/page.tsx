'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import EmergencyQr from '@/src/components/emergency/EmergencyQr';
import { Button, Card, Input, Textarea } from '@/src/components/ui/primitives';
import { Check, Plus, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';

type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  alternatePhone: string | null;
  priority: number;
  notes: string | null;
  active: boolean;
};

type EmergencyData = {
  preferredName: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  allergies: string | null;
  criticalConditions: string | null;
  currentMedications: string | null;
  primaryDoctor: string | null;
  insuranceNote: string | null;
  emergencyNote: string | null;
  publicFields: string | null;
  token: string | null;
  tokenStatus: 'active' | 'revoked' | 'expired' | 'missing';
  publicUrl: string | null;
  contacts: EmergencyContact[];
  accessLogs: Array<{ timestamp: string; tokenRef: string }>;
} | null;

const PUBLIC_FIELDS = [
  { key: 'preferredName', label: 'Preferred name' },
  { key: 'dateOfBirth', label: 'DOB' },
  { key: 'bloodType', label: 'Blood type' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'criticalConditions', label: 'Critical conditions' },
  { key: 'currentMedications', label: 'Current medications' },
  { key: 'primaryDoctor', label: 'Primary doctor' },
  { key: 'insuranceNote', label: 'Insurance note' },
  { key: 'emergencyNote', label: 'Emergency note' },
  { key: 'contacts', label: 'Contacts' },
];

const EMPTY_FORM = {
  preferredName: '',
  dateOfBirth: '',
  bloodType: '',
  allergies: '',
  criticalConditions: '',
  currentMedications: '',
  primaryDoctor: '',
  insuranceNote: '',
  emergencyNote: '',
  publicFields: ['preferredName', 'bloodType', 'allergies', 'criticalConditions', 'contacts'] as string[],
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export default function EmergencyDashboardPage() {
  const [data, setData] = useState<EmergencyData>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contact, setContact] = useState({ name: '', relationship: '', phone: '', alternatePhone: '', priority: '1', notes: '', active: true });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const result = await (await fetch('/api/emergency')).json();
    setData(result);
    setForm({
      preferredName: result?.preferredName ?? '',
      dateOfBirth: result?.dateOfBirth ?? '',
      bloodType: result?.bloodType ?? '',
      allergies: result?.allergies ?? '',
      criticalConditions: result?.criticalConditions ?? '',
      currentMedications: result?.currentMedications ?? '',
      primaryDoctor: result?.primaryDoctor ?? '',
      insuranceNote: result?.insuranceNote ?? '',
      emergencyNote: result?.emergencyNote ?? '',
      publicFields: (() => {
        try {
          const parsed = JSON.parse(result?.publicFields || '[]');
          return Array.isArray(parsed) && parsed.length ? parsed : EMPTY_FORM.publicFields;
        } catch {
          return EMPTY_FORM.publicFields;
        }
      })(),
    });
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const publicFieldSet = useMemo(() => new Set(form.publicFields), [form.publicFields]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          publicFields: form.publicFields,
        }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const rotateToken = async (active = true) => {
    await fetch('/api/emergency/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    await load();
  };

  const addContact = async () => {
    await fetch('/api/emergency/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    setContact({ name: '', relationship: '', phone: '', alternatePhone: '', priority: '1', notes: '', active: true });
    await load();
  };

  const updateContact = async (id: string, patch: Partial<EmergencyContact>) => {
    await fetch(`/api/emergency/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await load();
  };

  const deleteContact = async (id: string) => {
    await fetch(`/api/emergency/contacts/${id}`, { method: 'DELETE' });
    await load();
  };

  const copyLink = async () => {
    if (!data?.publicUrl) return;
    await navigator.clipboard.writeText(data.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!data) {
    return (
      <DashboardShell>
        <Card className="animate-pulse p-8">Loading emergency profile...</Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 print:space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Emergency Profile</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Public emergency card</h1>
            <p className="text-sm text-muted-foreground">Only fields you explicitly enable appear on the public page.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void rotateToken(true)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Rotate
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void rotateToken(false)}>
              Revoke
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] print:grid-cols-1">
          <Card className="space-y-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Emergency profile editor</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Preferred name" value={form.preferredName} onChange={(e) => setForm({ ...form, preferredName: e.target.value })} />
              <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              <Input label="Blood type" value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} />
              <Input label="Primary doctor" value={form.primaryDoctor} onChange={(e) => setForm({ ...form, primaryDoctor: e.target.value })} />
              <Textarea label="Allergies" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="md:col-span-2" />
              <Textarea label="Critical conditions" value={form.criticalConditions} onChange={(e) => setForm({ ...form, criticalConditions: e.target.value })} className="md:col-span-2" />
              <Textarea label="Current medications" value={form.currentMedications} onChange={(e) => setForm({ ...form, currentMedications: e.target.value })} className="md:col-span-2" />
              <Textarea label="Insurance note" value={form.insuranceNote} onChange={(e) => setForm({ ...form, insuranceNote: e.target.value })} className="md:col-span-2" />
              <Textarea label="Emergency note" value={form.emergencyNote} onChange={(e) => setForm({ ...form, emergencyNote: e.target.value })} className="md:col-span-2" />
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-semibold">Public visibility controls</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PUBLIC_FIELDS.map((field) => (
                  <label key={field.key} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={publicFieldSet.has(field.key)}
                      onChange={(e) => {
                        const next = new Set(form.publicFields);
                        if (e.target.checked) next.add(field.key);
                        else next.delete(field.key);
                        setForm({ ...form, publicFields: [...next] });
                      }}
                    />
                    {field.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void saveProfile()} disabled={saving}>
                <Check className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save emergency profile'}
              </Button>
              <Button variant="secondary" onClick={() => void load()}>
                Reload
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Token and QR</h2>
                <p className="text-sm text-muted-foreground">Status, share link, and printable card.</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {data.tokenStatus}
              </span>
            </div>
            <EmergencyQr publicUrl={data.publicUrl} tokenStatus={data.tokenStatus} onCopy={() => void copyLink()} onPrint={() => window.print()} />
            {copied ? <p className="text-xs text-emerald-400">Public link copied.</p> : null}
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
              <div className="font-semibold">Recent access</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {data.accessLogs.length > 0 ? data.accessLogs.map((entry) => <div key={`${entry.timestamp}-${entry.tokenRef}`}>{formatTimestamp(entry.timestamp)}</div>) : <div>No access yet.</div>}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] print:grid-cols-1">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Emergency contacts</h2>
              <span className="text-xs text-muted-foreground">{data.contacts.length} contacts</span>
            </div>
            <div className="grid gap-3">
              <Input label="Name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              <Input label="Relationship" value={contact.relationship} onChange={(e) => setContact({ ...contact, relationship: e.target.value })} />
              <Input label="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              <Input label="Alternate phone" value={contact.alternatePhone} onChange={(e) => setContact({ ...contact, alternatePhone: e.target.value })} />
              <Input label="Priority" type="number" value={contact.priority} onChange={(e) => setContact({ ...contact, priority: e.target.value })} />
              <Textarea label="Notes" value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={contact.active} onChange={(e) => setContact({ ...contact, active: e.target.checked })} />
                Active contact
              </label>
              <Button onClick={() => void addContact()}>
                <Plus className="mr-2 h-4 w-4" /> Add contact
              </Button>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Saved contacts</h2>
              <span className="text-xs text-muted-foreground">Minimum disclosure only</span>
            </div>
            <div className="space-y-3">
              {data.contacts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No contacts yet.</div>
              ) : (
                data.contacts.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{entry.name}</div>
                        <div className="text-xs text-muted-foreground">{entry.relationship} · Priority {entry.priority} · {entry.active ? 'Active' : 'Inactive'}</div>
                        <div className="mt-2 text-sm">{entry.phone}{entry.alternatePhone ? ` · ${entry.alternatePhone}` : ''}</div>
                        {entry.notes ? <div className="mt-2 text-xs text-muted-foreground">{entry.notes}</div> : null}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => void updateContact(entry.id, { active: !entry.active })}>
                          {entry.active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => void deleteContact(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
