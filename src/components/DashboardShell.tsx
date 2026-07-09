'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { ThemeToggle } from '@/src/components/theme-toggle';
import EmergencyQr from '@/src/components/emergency/EmergencyQr';
import {
  Home,
  Apple,
  Droplet,
  Moon,
  TrendingDown,
  Activity,
  Pill,
  Calendar,
  FileText,
  Clock,
  Users,
  ShieldAlert,
  Bell,
  ListTodo,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Modal, Button } from '@/src/components/ui/primitives';

type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  alternatePhone: string | null;
  priority: number;
  active: boolean;
};

type EmergencyData = {
  preferredName: string | null;
  bloodType: string | null;
  allergies: string | null;
  criticalConditions: string | null;
  currentMedications: string | null;
  emergencyNote: string | null;
  tokenStatus: 'active' | 'revoked' | 'expired' | 'missing';
  publicUrl: string | null;
  contacts: EmergencyContact[];
} | null;

function formatEmergencyValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

function splitEmergencyList(value: string | null | undefined) {
  return (value ?? '')
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, activeProfile, familyProfiles, switchProfile, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
  const activeProfileId = activeProfile?.id ?? '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState<EmergencyData>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; unread: boolean; timestamp: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted) return;
        setNotifications((data.notifications || []).map((item: { id: string; title: string; message: string; isRead: boolean; timestamp: string }) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          unread: !item.isRead,
          timestamp: item.timestamp,
        })));
      } catch {
        if (mounted) setNotifications([]);
      }
    };
    loadNotifications();
    return () => {
      mounted = false;
    };
  }, [activeProfileId]);

  useEffect(() => {
    let mounted = true;
    if (!emergencyOpen) return;

    const loadEmergency = async () => {
      setEmergencyLoading(true);
      setEmergencyError(null);
      try {
        const response = await fetch('/api/emergency');
        if (!mounted) return;
        if (response.status === 404) {
          setEmergencyData(null);
          return;
        }
        if (!response.ok) {
          throw new Error(`Emergency profile request failed (${response.status})`);
        }
        const data = await response.json();
        if (!mounted) return;
        setEmergencyData(data);
      } catch (error) {
        if (!mounted) return;
        setEmergencyData(null);
        setEmergencyError(error instanceof Error ? error.message : 'Emergency profile unavailable');
      } finally {
        if (mounted) setEmergencyLoading(false);
      }
    };

    void loadEmergency();
    return () => {
      mounted = false;
    };
  }, [activeProfileId, emergencyOpen]);

  if (isLoading || !user || !activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground text-sm tracking-wide">Syncing your health environment...</p>
      </div>
    );
  }

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Nutrition', href: '/dashboard/nutrition', icon: Apple },
    { name: 'Hydration', href: '/dashboard/hydration', icon: Droplet },
    { name: 'Sleep Log', href: '/dashboard/sleep', icon: Moon },
    { name: 'Weight Trend', href: '/dashboard/weight', icon: TrendingDown },
    { name: 'Activity Log', href: '/dashboard/activity', icon: Activity },
    { name: 'Medications', href: '/dashboard/medications', icon: Pill },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Records Vault', href: '/dashboard/records', icon: FileText },
    { name: 'Connected Timeline', href: '/dashboard/timeline', icon: Clock },
    { name: 'Notifications', href: '/dashboard/notifications', icon: ListTodo },
    { name: 'Care Circle', href: '/dashboard/care-circle', icon: Users },
    { name: 'Emergency Profile', href: '/dashboard/emergency', icon: ShieldAlert },
  ];

  const handleProfileSwitch = (id: string) => {
    switchProfile(id);
    setProfileDropdownOpen(false);
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  const isSharedContext = activeProfile.relationship !== 'SELF';
  const userInitials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/70 bg-surface p-5 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-2 pb-6 border-b border-border/40 mb-6">
          <ShieldAlert className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-gradient">WELLSYNC</span>
        </div>

        {/* Profile Selector */}
        <div className="relative mb-6">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center justify-between w-full p-2.5 rounded-lg bg-background border border-border/80 text-left hover:border-primary/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Member</span>
              <span className="text-sm font-semibold truncate text-foreground">{activeProfile.name}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          </button>
          
          {profileDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 py-1">
              <p className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40">Switch Profile</p>
              {familyProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProfileSwitch(p.id)}
                  className={`flex w-full items-center px-3 py-2 text-sm text-left hover:bg-border/40 transition-colors cursor-pointer ${
                    p.id === activeProfile.id ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                  }`}
                >
                  <span className="truncate">{p.name} {p.relationship === 'SELF' ? '(You)' : `(${p.relationship.toLowerCase()})`}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = normalizedPathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-surface-muted ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-border/40 space-y-2 mt-auto">
          <button
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center w-full space-x-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all border border-red-900/30 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Emergency Card</span>
          </button>

          <Link
            href="/dashboard/profile"
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/80 bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {userInitials || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground">
                <ChevronRight className="h-4 w-4 opacity-70" />
              </span>
          </Link>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-8 border-b border-border/70 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          {/* Mobile Menu Trigger & Logo */}
          <div className="flex items-center space-x-4 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground hover:text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg"
            >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            <span className="text-lg font-bold tracking-tight text-gradient">WELLSYNC</span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Hi, {user.name}</span>
            <span className="text-border">|</span>
            <span className="text-foreground font-medium">Active: {activeProfile.name}</span>
            {isSharedContext && (
              <>
                <span className="text-border">|</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Shared with you</span>
              </>
            )}
          </div>

          {/* Action Header Items */}
          <div className="flex items-center space-x-3">
            {/* Notifications Bell */}
            <ThemeToggle />

            <div className="relative">
              <button
                onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
                className="p-2 rounded-lg hover:bg-surface-muted text-muted-foreground hover:text-foreground relative transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification Box */}
              {notifDrawerOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-2xl z-50 py-2">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-border/45 mb-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Alert Center</span>
                    <button onClick={async () => {
                      await fetch('/api/notifications/read-all', { method: 'POST' });
                      setNotifications(notifications.map(n => ({ ...n, unread: false })));
                    }} className="text-xs text-primary hover:underline cursor-pointer">
                      Mark read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto px-2 space-y-1.5">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-lg text-xs leading-relaxed transition-colors ${n.unread ? 'bg-primary/5 border border-primary/10' : 'bg-transparent'}`}>
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-semibold text-foreground">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Profile Dropdown Switcher */}
            <div className="relative lg:hidden">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-1 p-2 rounded-lg hover:bg-surface-muted text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <span className="max-w-[80px] truncate">{activeProfile.name}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-2xl z-50 py-1">
                  <p className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase border-b border-border/40">Switch profile</p>
                  {familyProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProfileSwitch(p.id)}
                      className={`flex w-full items-center px-3 py-2 text-sm text-left hover:bg-border/40 cursor-pointer ${
                        p.id === activeProfile.id ? 'text-primary bg-primary/5 font-semibold' : 'text-foreground'
                      }`}
                    >
                      <span>{p.name}</span>
                      {p.relationship !== 'SELF' ? <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">Shared</span> : null}
                    </button>
                  ))}
                  <div className="border-t border-border/40 mt-1 py-1">
                    <button
                      onClick={() => setEmergencyOpen(true)}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-950/20 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      <span>Emergency Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border/70 z-40 flex items-center justify-around px-2">
        <Link href="/dashboard" className={`flex flex-col items-center space-y-0.5 text-xs ${pathname === '/dashboard' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link href="/dashboard/nutrition" className={`flex flex-col items-center space-y-0.5 text-xs ${pathname === '/dashboard/nutrition' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <Apple className="w-5 h-5" />
          <span>Nutrition</span>
        </Link>
        <Link href="/dashboard/medications" className={`flex flex-col items-center space-y-0.5 text-xs ${pathname === '/dashboard/medications' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <Pill className="w-5 h-5" />
          <span>Meds</span>
        </Link>
        <Link href="/dashboard/appointments" className={`flex flex-col items-center space-y-0.5 text-xs ${pathname === '/dashboard/appointments' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <Calendar className="w-5 h-5" />
          <span>Calendar</span>
        </Link>
        <button
          onClick={logout}
          className="flex flex-col items-center space-y-0.5 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Exit</span>
        </button>
      </nav>

      {/* 4. MOBILE DRAWER OVERLAY MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 bg-surface border-r border-border p-5 flex flex-col z-10">
            <div className="flex items-center justify-between pb-6 border-b border-border/40 mb-6">
              <span className="text-xl font-bold tracking-tight text-gradient">WELLSYNC</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-grow space-y-1.5 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = normalizedPathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm ${
                      isActive ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-border/40 mt-auto">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEmergencyOpen(true);
                }}
                className="flex items-center w-full space-x-3 px-3 py-2 rounded-lg text-sm text-red-400 border border-red-900/30 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="font-semibold">Emergency Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EMERGENCY QUICK PANEL MODAL */}
      <Modal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} title="Emergency Health Card">
        <div className="space-y-4">
          <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-4 flex items-center gap-4 dark:bg-red-950/30">
            <ShieldAlert className="w-8 h-8 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-400">Critical Medical Disclosure</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Authenticated emergency summary for the active profile. Only saved emergency fields are shown here.
              </p>
            </div>
          </div>

          {emergencyLoading ? (
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="h-5 w-32 animate-pulse rounded bg-border/60" />
              <div className="h-4 w-full animate-pulse rounded bg-border/50" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-border/50" />
              <div className="h-52 animate-pulse rounded-2xl border border-border/60 bg-border/30" />
            </div>
          ) : emergencyError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Emergency profile unavailable</p>
                  <p className="mt-1 text-xs text-muted-foreground">{emergencyError}</p>
                </div>
              </div>
            </div>
          ) : !emergencyData ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
              No emergency profile is configured for the active profile yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-background p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blood Group</span>
                  <p className="mt-1 text-lg font-bold text-foreground">{formatEmergencyValue(emergencyData.bloodType)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact</span>
                  {emergencyData.contacts.filter((contact) => contact.active).length > 0 ? (
                    <div className="mt-1 space-y-2">
                      {emergencyData.contacts
                        .filter((contact) => contact.active)
                        .slice(0, 2)
                        .map((contact) => (
                          <div key={contact.id} className="space-y-0.5">
                            <p className="text-sm font-semibold text-foreground">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                            <p className="text-xs text-muted-foreground">{contact.phone}</p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Not provided</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="border-t border-border/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirmed Allergies</span>
                  <p className="mt-1 text-sm font-semibold text-red-400">
                    {splitEmergencyList(emergencyData.allergies).length > 0 ? splitEmergencyList(emergencyData.allergies).join(', ') : 'Not provided'}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Critical Conditions</span>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatEmergencyValue(emergencyData.criticalConditions)}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Medications</span>
                  <p className="mt-1 text-sm text-foreground">
                    {formatEmergencyValue(emergencyData.currentMedications)}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Important Notes</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatEmergencyValue(emergencyData.emergencyNote)}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Emergency QR</span>
                    <p className="text-xs text-muted-foreground">Encodes the active public emergency URL only.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => void (async () => {
                    setEmergencyLoading(true);
                    try {
                      const response = await fetch('/api/emergency');
                      if (response.ok) setEmergencyData(await response.json());
                    } finally {
                      setEmergencyLoading(false);
                    }
                  })()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
                <EmergencyQr
                  publicUrl={emergencyData.publicUrl}
                  tokenStatus={emergencyData.tokenStatus}
                  onCopy={async () => {
                    if (!emergencyData.publicUrl) return;
                    await navigator.clipboard.writeText(emergencyData.publicUrl);
                  }}
                  onPrint={() => window.print()}
                />
                <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Profile scope</p>
                  <p className="mt-1">
                    This modal shows owner-authorized emergency details for the currently active profile. Public-enabled visibility still governs the public emergency page at {emergencyData.publicUrl ? <a href={emergencyData.publicUrl} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">{emergencyData.publicUrl}</a> : 'the public page'}.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setEmergencyOpen(false)}>
              Close Card
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
