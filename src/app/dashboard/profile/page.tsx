'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Button, Card, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2, Lock, LogOut, User } from 'lucide-react';

type MeResponse = {
  user: { id: string; email: string; name: string };
  activeProfile: { id: string; name: string; relationship: string };
};

type HealthProfile = {
  dateOfBirth: string | null;
  height: number | null;
  targetWeight: number | null;
  activityLevel: string | null;
  dietaryPreference: string | null;
  allergies: string | null;
  foodRestrictions: string | null;
  healthGoals: string | null;
  sleepWakeTime: string | null;
  sleepBedTime: string | null;
  preferredUnits: string | null;
  timezone: string;
};

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

const INITIAL_HEALTH: HealthProfile = {
  dateOfBirth: null,
  height: null,
  targetWeight: null,
  activityLevel: null,
  dietaryPreference: null,
  allergies: null,
  foodRestrictions: null,
  healthGoals: null,
  sleepWakeTime: null,
  sleepBedTime: null,
  preferredUnits: null,
  timezone: 'UTC',
};

export default function ProfilePage() {
  const { refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [health, setHealth] = useState<HealthProfile>(INITIAL_HEALTH);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', relationship: '', phone: '', alternatePhone: '', priority: '1', notes: '', active: true });
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  const initials = useMemo(() => {
    const name = me?.user.name || '';
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  }, [me?.user.name]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, profileRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/profile')]);
      if (!meRes.ok) throw new Error('Unable to load account details');
      const meData = await meRes.json();
      setMe(meData);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setHealth({
          dateOfBirth: profileData.dateOfBirth ?? null,
          height: profileData.height ?? null,
          targetWeight: profileData.targetWeight ?? null,
          activityLevel: profileData.activityLevel ?? null,
          dietaryPreference: profileData.dietaryPreference ?? null,
          allergies: profileData.allergies ?? null,
          foodRestrictions: profileData.foodRestrictions ?? null,
          healthGoals: profileData.healthGoals ?? null,
          sleepWakeTime: profileData.sleepWakeTime ?? null,
          sleepBedTime: profileData.sleepBedTime ?? null,
          preferredUnits: profileData.preferredUnits ?? null,
          timezone: profileData.timezone ?? 'UTC',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load account details');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    setContactsError(null);
    try {
      const res = await fetch('/api/emergency');
      if (!res.ok) throw new Error('Unable to load emergency contacts');
      const data = await res.json();
      setContacts(Array.isArray(data?.contacts) ? data.contacts : []);
    } catch (err) {
      setContactsError(err instanceof Error ? err.message : 'Unable to load emergency contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
      void loadContacts();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showFeedback = (message: string) => {
    setError(null);
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 2500);
  };

  const saveAccount = async () => {
    if (!me) return;
    setSavingAccount(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: me.user.name }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to save account');
      await refreshSession();
      showFeedback('Account updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save account');
    } finally {
      setSavingAccount(false);
    }
  };

  const saveHealth = async () => {
    setSavingHealth(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(health),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to save profile');
      showFeedback('Profile details updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setSavingHealth(false);
    }
  };

  const changePassword = async () => {
    setSavingPassword(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to change password');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showFeedback('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const saveContact = async () => {
    setSavingContact(true);
    setContactsError(null);
    try {
      const res = await fetch('/api/emergency/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error('Unable to save emergency contact');
      setContactForm({ name: '', relationship: '', phone: '', alternatePhone: '', priority: '1', notes: '', active: true });
      await loadContacts();
      showFeedback('Emergency contact saved.');
    } catch (err) {
      setContactsError(err instanceof Error ? err.message : 'Unable to save emergency contact');
    } finally {
      setSavingContact(false);
    }
  };

  const updateContact = async (id: string, patch: Partial<EmergencyContact>) => {
    setContactsError(null);
    const res = await fetch(`/api/emergency/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setContactsError('Unable to update emergency contact');
      return;
    }
    await loadContacts();
  };

  const deleteContact = async (id: string) => {
    setContactsError(null);
    const res = await fetch(`/api/emergency/contacts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setContactsError('Unable to delete emergency contact');
      return;
    }
    await loadContacts();
  };

  if (loading) {
    return (
      <DashboardShell>
        <Card className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading account profile...
        </Card>
      </DashboardShell>
    );
  }

  if (!me) return null;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Account Profile</p>
          <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your authenticated account and the onboarding details stored in your health profile.</p>
        </div>

        {error ? <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-sm text-red-300">{error}</div> : null}
        {success ? <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-4 text-sm text-emerald-300">{success}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary/10 text-lg font-bold text-primary">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold">Account Identity</h2>
                <p className="text-sm text-muted-foreground">This is your authenticated WellSync account.</p>
              </div>
            </div>

            <Input label="Display name" value={me.user.name} onChange={(e) => setMe({ ...me, user: { ...me.user, name: e.target.value } })} />
            <Input label="Email" value={me.user.email} readOnly />
            <div className="text-xs text-muted-foreground">Email is read-only because it is the current login identifier.</div>

            <div className="flex gap-2">
              <Button onClick={() => void saveAccount()} disabled={savingAccount} leftIcon={<User className="h-4 w-4" />}>
                {savingAccount ? 'Saving...' : 'Save account'}
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card id="security" className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Health Profile</h2>
                <p className="text-sm text-muted-foreground">These are the onboarding details already stored in your profile.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Date of birth" type="date" value={health.dateOfBirth ?? ''} onChange={(e) => setHealth({ ...health, dateOfBirth: e.target.value })} />
                <Input label="Height (cm)" type="number" value={health.height ?? ''} onChange={(e) => setHealth({ ...health, height: e.target.value ? Number(e.target.value) : null })} />
                <Input label="Target weight (kg)" type="number" value={health.targetWeight ?? ''} onChange={(e) => setHealth({ ...health, targetWeight: e.target.value ? Number(e.target.value) : null })} />
                <Select label="Activity level" value={health.activityLevel ?? ''} onChange={(e) => setHealth({ ...health, activityLevel: e.target.value || null })} options={[
                  { value: '', label: 'Not provided' },
                  { value: 'SEDENTARY', label: 'Sedentary' },
                  { value: 'LIGHTLY_ACTIVE', label: 'Lightly active' },
                  { value: 'MODERATELY_ACTIVE', label: 'Moderately active' },
                  { value: 'VERY_ACTIVE', label: 'Very active' },
                ]} />
                <Select label="Dietary preference" value={health.dietaryPreference ?? ''} onChange={(e) => setHealth({ ...health, dietaryPreference: e.target.value || null })} options={[
                  { value: '', label: 'Not provided' },
                  { value: 'VEGETARIAN', label: 'Vegetarian' },
                  { value: 'VEGAN', label: 'Vegan' },
                  { value: 'EGGETARIAN', label: 'Eggetarian' },
                  { value: 'OMNIVORE', label: 'Omnivore' },
                  { value: 'CUSTOM', label: 'Custom' },
                ]} />
                <Input label="Timezone" value={health.timezone} onChange={(e) => setHealth({ ...health, timezone: e.target.value })} />
                <Input label="Wake time" type="time" value={health.sleepWakeTime ?? ''} onChange={(e) => setHealth({ ...health, sleepWakeTime: e.target.value })} />
                <Input label="Bed time" type="time" value={health.sleepBedTime ?? ''} onChange={(e) => setHealth({ ...health, sleepBedTime: e.target.value })} />
              </div>
              <Textarea label="Allergies" value={health.allergies ?? ''} onChange={(e) => setHealth({ ...health, allergies: e.target.value })} />
              <Textarea label="Food restrictions" value={health.foodRestrictions ?? ''} onChange={(e) => setHealth({ ...health, foodRestrictions: e.target.value })} />
              <Textarea label="Health goals" value={health.healthGoals ?? ''} onChange={(e) => setHealth({ ...health, healthGoals: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={() => void saveHealth()} disabled={savingHealth}> {savingHealth ? 'Saving...' : 'Save profile details'} </Button>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Change Password</h2>
              </div>
              <div className="grid gap-4">
                <Input label="Current password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                <Input label="New password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                <Input label="Confirm new password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void changePassword()} disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Update password'}</Button>
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Account Actions</h2>
                <p className="text-sm text-muted-foreground">Manage session actions for your authenticated account.</p>
              </div>
              <Button variant="danger" onClick={() => void logout()} leftIcon={<LogOut className="h-4 w-4" />}>
                Sign Out
              </Button>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Emergency Contacts</h2>
                  <p className="text-sm text-muted-foreground">Manage the contacts that appear in your emergency profile.</p>
                </div>
                <span className="text-xs text-muted-foreground">{contacts.length} contacts</span>
              </div>

              {contactsError ? <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-sm text-red-300">{contactsError}</div> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                <Input label="Relationship" value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} />
                <Input label="Phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                <Input label="Alternate phone" value={contactForm.alternatePhone} onChange={(e) => setContactForm({ ...contactForm, alternatePhone: e.target.value })} />
                <Input label="Priority" type="number" value={contactForm.priority} onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })} />
                <div className="flex items-center gap-2 pt-7 text-sm">
                  <input type="checkbox" checked={contactForm.active} onChange={(e) => setContactForm({ ...contactForm, active: e.target.checked })} />
                  Active contact
                </div>
              </div>
              <Textarea label="Notes" value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={() => void saveContact()} disabled={savingContact}>
                  {savingContact ? 'Saving...' : 'Save contact'}
                </Button>
                <Button variant="secondary" onClick={() => void loadContacts()} disabled={loadingContacts}>
                  Reload contacts
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                {loadingContacts ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Loading emergency contacts...</div>
                ) : contacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No emergency contacts yet.</div>
                ) : (
                  contacts.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-semibold">{entry.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.relationship} · Priority {entry.priority} · {entry.active ? 'Active' : 'Inactive'}
                          </div>
                          <div className="mt-2 text-sm">
                            {entry.phone}
                            {entry.alternatePhone ? ` · ${entry.alternatePhone}` : ''}
                          </div>
                          {entry.notes ? <div className="mt-2 text-xs text-muted-foreground">{entry.notes}</div> : null}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => void updateContact(entry.id, { active: !entry.active })}>
                            {entry.active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => void deleteContact(entry.id)}>
                            Delete
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
      </div>
    </DashboardShell>
  );
}
