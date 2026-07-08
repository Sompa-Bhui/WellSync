'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';

type PermissionMap = Record<string, boolean>;
type ItemStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';

type Invitation = {
  id: string;
  email: string;
  relationshipLabel: string;
  role: string;
  status: ItemStatus;
  expiresAt: string | null;
  createdAt: string;
  permissions: string;
  token: string;
};

type Member = {
  id: string;
  email: string;
  relationshipLabel: string;
  role: string;
  permissions: string;
  active: boolean;
  acceptedAt: string | null;
  revokedAt: string | null;
  familyProfile: { id: string; name: string; relationship: string };
};

type Response = {
  invitations: Invitation[];
  members: Member[];
};

type AuditLog = {
  id: string;
  action: string;
  target: string;
  timestamp: string;
};

const PERMISSION_GROUPS: Array<{ label: string; permissions: Array<{ key: string; label: string; detail: string }> }> = [
  { label: 'Overview', permissions: [{ key: 'dashboard.summary.view', label: 'View summary', detail: 'Allow access to the shared dashboard summary.' }] },
  { label: 'Daily tracking', permissions: [
    { key: 'nutrition.view', label: 'View nutrition', detail: 'Read nutrition logs and meal summaries.' },
    { key: 'hydration.view', label: 'View hydration', detail: 'Read water intake and hydration status.' },
    { key: 'sleep.view', label: 'View sleep', detail: 'Read sleep entries and sleep trends.' },
    { key: 'weight.view', label: 'View weight', detail: 'Read weight entries and trends.' },
    { key: 'activity.view', label: 'View activity', detail: 'Read activity logs and workouts.' },
  ] },
  { label: 'Medication', permissions: [
    { key: 'medications.view', label: 'View medications', detail: 'Read medication definitions and schedules.' },
    { key: 'medications.manage_events', label: 'Manage medication events', detail: 'Record taken, skipped, or missed dose events.' },
  ] },
  { label: 'Appointments', permissions: [
    { key: 'appointments.view', label: 'View appointments', detail: 'Read appointment details and history.' },
    { key: 'appointments.manage', label: 'Manage appointments', detail: 'Create, update, and cancel appointments.' },
    { key: 'followups.view', label: 'View follow-ups', detail: 'Read follow-up task details.' },
    { key: 'followups.manage', label: 'Manage follow-ups', detail: 'Create and update follow-up tasks.' },
  ] },
  { label: 'Records and timeline', permissions: [
    { key: 'records.view', label: 'View records', detail: 'Read medical records metadata.' },
    { key: 'records.add', label: 'Add records', detail: 'Upload or create record entries.' },
    { key: 'timeline.view', label: 'View timeline', detail: 'Read timeline events.' },
  ] },
];

function parsePermissions(value: string | PermissionMap | null | undefined) {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as PermissionMap;
    } catch {
      return {};
    }
  }
  return value;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{children}</span>;
}

export default function CareCirclePage() {
  const [data, setData] = useState<Response | null>(null);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({ role: 'viewer', relationshipLabel: '', permissions: {} as PermissionMap, active: true });
  const [inviteForm, setInviteForm] = useState({ familyProfileId: '', email: '', role: 'viewer', relationshipLabel: 'Trusted caregiver', expiresAt: '' });
  const [auditFilter, setAuditFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [careRes, auditRes] = await Promise.all([fetch('/api/care-circle'), fetch('/api/audit')]);
      if (!careRes.ok) throw new Error('Unable to load Care Circle');
      setData(await careRes.json());
      if (auditRes.ok) setAudits((await auditRes.json()).logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Care Circle');
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

  const auditEvents = useMemo(() => {
    if (auditFilter === 'all') return audits;
    return audits.filter((item) => item.action.includes(auditFilter.toUpperCase()));
  }, [audits, auditFilter]);

  const submitInvite = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/care-circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Invite failed');
      setInviteForm((prev) => ({ ...prev, email: '', relationshipLabel: 'Trusted caregiver', expiresAt: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setSubmitting(false);
    }
  };

  const saveMember = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/care-circle/members/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: memberForm.role,
          relationshipLabel: memberForm.relationshipLabel,
          permissions: memberForm.permissions,
          active: memberForm.active,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to save member');
      setSelectedMember(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save member');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeMember = async (member: Member) => {
    if (!confirm(`Revoke access for ${member.email}?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/care-circle/members/${member.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to revoke');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeInvitation = async (invite: Invitation) => {
    if (!confirm(`Revoke invitation for ${invite.email}?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/care-circle/invitations/${invite.token}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to revoke invitation');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (key: string) => {
    setMemberForm((prev) => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
  };

  if (loading) {
    return (
      <DashboardShell>
        <Card className="animate-pulse">Loading Care Circle...</Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Care Circle</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Trusted members and shared profiles</h1>
          <p className="text-sm text-muted-foreground">Invite in-app, manage granular access, and review ownership context for shared profiles.</p>
        </div>

        {error ? <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-sm text-red-300">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Invite caregiver</h2>
              <Badge>In-app invitation</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Family profile ID" value={inviteForm.familyProfileId} onChange={(e) => setInviteForm({ ...inviteForm, familyProfileId: e.target.value })} />
              <Input label="Email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
              <Select label="Role" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} options={[{ value: 'viewer', label: 'Viewer' }, { value: 'caregiver', label: 'Caregiver' }, { value: 'manager', label: 'Manager' }]} />
              <Input label="Relationship label" value={inviteForm.relationshipLabel} onChange={(e) => setInviteForm({ ...inviteForm, relationshipLabel: e.target.value })} />
              <Input label="Expires at" type="datetime-local" value={inviteForm.expiresAt} onChange={(e) => setInviteForm({ ...inviteForm, expiresAt: e.target.value })} />
              <div className="flex items-end">
                <Button onClick={() => void submitInvite()} disabled={submitting}>{submitting ? 'Sending...' : 'Create invitation'}</Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Shared profile context</h2>
              <Badge>Active profile aware</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data?.members?.map((member) => (
                <div key={member.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{member.familyProfile.name}</div>
                      <div className="text-xs text-muted-foreground">{member.familyProfile.relationship} · {member.role}</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedMember(member)}>Edit</Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Shared with you · {member.relationshipLabel}</div>
                </div>
              ))}
              {(!data?.members || data.members.length === 0) && <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No shared profiles yet.</div>}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Trusted members</h2>
              <Badge>{data?.members?.length || 0} members</Badge>
            </div>
            <div className="space-y-3">
              {data?.members?.length ? data.members.map((member) => {
                const permissions = parsePermissions(member.permissions);
                const enabled = Object.entries(permissions).filter(([, value]) => value).map(([key]) => key);
                return (
                  <div key={member.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold">{member.email}</div>
                          <Badge>{member.role}</Badge>
                          <Badge>{member.active ? 'Active' : 'Revoked'}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{member.relationshipLabel}</div>
                        <div className="text-xs text-muted-foreground">{member.acceptedAt ? `Accepted ${new Date(member.acceptedAt).toLocaleString()}` : 'Pending or unaccepted'}</div>
                        <div className="mt-2 text-xs text-muted-foreground">{enabled.length ? enabled.join(' · ') : 'No permissions enabled'}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setMemberForm({
                              role: member.role,
                              relationshipLabel: member.relationshipLabel,
                              permissions: parsePermissions(member.permissions),
                              active: member.active,
                            });
                          }}
                        >
                          Edit permissions
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => void revokeMember(member)} disabled={submitting}>Revoke</Button>
                      </div>
                    </div>
                  </div>
                );
              }) : <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No trusted members yet.</div>}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Invitations</h2>
              <Badge>{data?.invitations?.length || 0} invitations</Badge>
            </div>
            <div className="space-y-3">
              {data?.invitations?.length ? data.invitations.map((invite) => (
                <div key={invite.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">{invite.email}</div>
                        <Badge>{invite.status}</Badge>
                        <Badge>{invite.role}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{invite.relationshipLabel}</div>
                      <div className="text-xs text-muted-foreground">{invite.expiresAt ? `Expires ${new Date(invite.expiresAt).toLocaleString()}` : 'No expiration set'} · Created {new Date(invite.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      {invite.status === 'pending' ? <Button variant="secondary" size="sm" onClick={() => void revokeInvitation(invite)} disabled={submitting}>Revoke</Button> : null}
                    </div>
                  </div>
                </div>
              )) : <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No invitations yet.</div>}
            </div>
          </Card>
        </div>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Care Circle audit</h2>
            <Select label="Filter" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} options={[
              { value: 'all', label: 'All' },
              { value: 'invite', label: 'Invitations' },
              { value: 'member', label: 'Members' },
              { value: 'handoff', label: 'Handoffs' },
            ]} />
          </div>
          <div className="space-y-2">
            {auditEvents.length ? auditEvents.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{item.action}</span>
                  <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">{item.target}</div>
              </div>
            )) : <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No audit entries available.</div>}
          </div>
        </Card>
      </div>

      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Edit member access</h3>
                <p className="text-sm text-muted-foreground">{selectedMember.email} · {selectedMember.relationshipLabel}</p>
              </div>
              <Button variant="secondary" onClick={() => setSelectedMember(null)}>Close</Button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Select label="Role" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} options={[{ value: 'viewer', label: 'Viewer' }, { value: 'caregiver', label: 'Caregiver' }, { value: 'manager', label: 'Manager' }]} />
              <Input label="Relationship label" value={memberForm.relationshipLabel} onChange={(e) => setMemberForm({ ...memberForm, relationshipLabel: e.target.value })} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label} className="rounded-xl border border-border p-4">
                  <div className="mb-3 font-semibold">{group.label}</div>
                  <div className="space-y-2">
                    {group.permissions.map((permission) => (
                      <label key={permission.key} className="flex items-start gap-3 rounded-lg border border-border/70 p-2 text-sm">
                        <input type="checkbox" checked={Boolean(memberForm.permissions[permission.key])} onChange={() => togglePermission(permission.key)} />
                        <div>
                          <div className="font-medium">{permission.label}</div>
                          <div className="text-xs text-muted-foreground">{permission.detail}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={memberForm.active} onChange={(e) => setMemberForm({ ...memberForm, active: e.target.checked })} /> Active</label>
            </div>
            <div className="mt-5 flex gap-2">
              <Button onClick={() => void saveMember()} disabled={submitting}>Save member</Button>
              <Button variant="secondary" onClick={() => setSelectedMember(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
