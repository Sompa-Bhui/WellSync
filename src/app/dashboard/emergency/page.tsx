'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import EmergencyQr from '@/src/components/emergency/EmergencyQr';
import { Button, Card, Input, Textarea } from '@/src/components/ui/primitives';
import { parsePublicFields } from '@/src/lib/emergency';
import { Check, RefreshCw, ShieldAlert } from 'lucide-react';

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
  publicFields: ['preferredName', 'bloodType', 'allergies', 'criticalConditions'] as string[],
};

const TOKEN_STATUS_LABELS: Record<'active' | 'revoked' | 'expired' | 'missing' | 'setup-required', string> = {
  active: 'ACTIVE',
  revoked: 'REVOKED',
  expired: 'EXPIRED',
  missing: 'MISSING',
  'setup-required': 'SETUP REQUIRED',
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export default function EmergencyDashboardPage() {
  const [data, setData] = useState<EmergencyData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadRequestId = React.useRef(0);
  const loadAbortRef = React.useRef<AbortController | null>(null);

  const load = async () => {
    const requestId = ++loadRequestId.current;
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    setLoading(true);

    try {
      const response = await fetch('/api/emergency', { signal: controller.signal });
      const result = await response.json();
      if (controller.signal.aborted || requestId !== loadRequestId.current) return;
      setError(null);
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
            return parsePublicFields(result?.publicFields);
          } catch {
            return EMPTY_FORM.publicFields;
          }
        })(),
      });
    } catch (error) {
      if (controller.signal.aborted || requestId !== loadRequestId.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setError(error instanceof Error ? error.message : 'Emergency profile unavailable');
    } finally {
      if (requestId === loadRequestId.current && loadAbortRef.current === controller) {
        loadAbortRef.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => load());
    return () => {
      loadAbortRef.current?.abort();
    };
  }, []);

  const publicFieldSet = useMemo(() => new Set(form.publicFields), [form.publicFields]);
  const hasEmergencyProfile = Boolean(data);
  const tokenState = hasEmergencyProfile ? data!.tokenStatus : 'setup-required';

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

  const copyLink = async () => {
    if (!data?.publicUrl) return;
    await navigator.clipboard.writeText(data.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 print:space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Emergency Profile</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Public emergency card</h1>
            <p className="text-sm text-muted-foreground">Only fields you explicitly enable appear on the public page.</p>
          </div>
          {hasEmergencyProfile ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => void rotateToken(true)} disabled={!data?.token}>
                <RefreshCw className="mr-2 h-4 w-4" /> Rotate
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void rotateToken(false)} disabled={!data?.token}>
                Revoke
              </Button>
            </div>
          ) : null}
        </div>

        {error ? (
          <Card className="space-y-3 p-6">
            <p className="text-sm font-semibold text-amber-500">Emergency profile unavailable</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </Card>
        ) : null}

        {loading ? (
          <Card className="space-y-4 p-6">
            <div className="h-6 w-44 animate-pulse rounded bg-border/60" />
            <div className="h-4 w-72 animate-pulse rounded bg-border/50" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-32 animate-pulse rounded-xl border border-border/60 bg-muted/20" />
              <div className="h-32 animate-pulse rounded-xl border border-border/60 bg-muted/20" />
            </div>
            <div className="h-64 animate-pulse rounded-xl border border-border/60 bg-muted/20" />
          </Card>
        ) : null}

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
              {data ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {TOKEN_STATUS_LABELS[tokenState]}
                </span>
              ) : (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {TOKEN_STATUS_LABELS[tokenState]}
                </span>
              )}
            </div>
            {data ? (
              <>
                <EmergencyQr publicUrl={data.publicUrl} tokenStatus={data.tokenStatus} onCopy={() => void copyLink()} onPrint={() => window.print()} />
                {copied ? <p className="text-xs text-emerald-400">Public link copied.</p> : null}
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
                  <div className="font-semibold">Recent access</div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {data.accessLogs.length > 0 ? data.accessLogs.map((entry) => <div key={`${entry.timestamp}-${entry.tokenRef}`}>{formatTimestamp(entry.timestamp)}</div>) : <div>No access yet.</div>}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Save your emergency profile to create your emergency card and QR code.
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
