'use client';

import React, { useEffect, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';

type CareCircleResponse = {
  invitations: Array<{ id: string; email: string; role: string; status: string }>;
  members: Array<{ id: string; email: string; relationshipLabel: string; role: string }>;
};

export default function CareCirclePage() {
  const [data, setData] = useState<CareCircleResponse | null>(null);
  const [form, setForm] = useState({ familyProfileId: '', email: '', role: 'viewer', relationshipLabel: 'Trusted caregiver', expiresAt: '' });

  useEffect(() => {
    void fetch('/api/care-circle').then((r) => r.json()).then(setData);
  }, []);

  const invite = async () => {
    await fetch('/api/care-circle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setData(await (await fetch('/api/care-circle')).json());
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold">Care Circle</h1>
        <Card className="grid gap-4 md:grid-cols-2">
          <Input label="Family profile ID" value={form.familyProfileId} onChange={(e) => setForm({ ...form, familyProfileId: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[{ value: 'viewer', label: 'Viewer' }, { value: 'caregiver', label: 'Caregiver' }, { value: 'manager', label: 'Manager' }]} />
          <Input label="Relationship label" value={form.relationshipLabel} onChange={(e) => setForm({ ...form, relationshipLabel: e.target.value })} />
          <Input label="Expires at" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          <div className="flex items-end"><Button onClick={invite}>Invite</Button></div>
        </Card>
        <Card>
          <div className="font-semibold mb-2">Invitations</div>
          <div className="space-y-2">{data?.invitations?.map((i) => <div key={i.id} className="text-sm">{i.email} · {i.role} · {i.status}</div>)}</div>
        </Card>
        <Card>
          <div className="font-semibold mb-2">Members</div>
          <div className="space-y-2">{data?.members?.map((m) => <div key={m.id} className="text-sm">{m.email} · {m.relationshipLabel} · {m.role}</div>)}</div>
        </Card>
      </div>
    </DashboardShell>
  );
}
