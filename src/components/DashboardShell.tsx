'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
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
  LogOut,
  ChevronDown,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { Modal, Button } from '@/src/components/ui/primitives';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, activeProfile, familyProfiles, switchProfile, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Upcoming Appointment', message: 'Follow-up with Dr. Sharma on July 11 at 11:30 AM.', time: '1h ago', unread: true },
    { id: 2, title: 'Medication Adherence', message: 'Missed scheduled dose for Amlodipine (Father) yesterday.', time: '1d ago', unread: true },
    { id: 3, title: 'Medical Report Uploaded', message: 'Apex Lab uploaded lipid profile blood test result.', time: '2d ago', unread: false }
  ]);

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
    { name: 'Care Circle', href: '/dashboard/care-circle', icon: Users },
    { name: 'Emergency Profile', href: '/dashboard/emergency', icon: ShieldAlert },
  ];

  const handleProfileSwitch = (id: string) => {
    switchProfile(id);
    setProfileDropdownOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card p-5 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-2 pb-6 border-b border-border/40 mb-6">
          <ShieldAlert className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-gradient">WELLSYNC</span>
        </div>

        {/* Profile Selector */}
        <div className="relative mb-6">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center justify-between w-full p-2.5 rounded-lg bg-background border border-border/80 text-left hover:border-primary/50 transition-colors cursor-pointer"
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
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-border/40 ${
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
          
          <button
            onClick={logout}
            className="flex items-center w-full space-x-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-8 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
          {/* Mobile Menu Trigger & Logo */}
          <div className="flex items-center space-x-4 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground hover:text-primary cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="text-lg font-bold tracking-tight text-gradient">WELLSYNC</span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Hi, {user.name}</span>
            <span className="text-border">|</span>
            <span className="text-foreground font-medium">Active: {activeProfile.name}</span>
          </div>

          {/* Action Header Items */}
          <div className="flex items-center space-x-3">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
                className="p-2 rounded-lg hover:bg-border/40 text-muted-foreground hover:text-foreground relative transition-colors cursor-pointer"
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
                    <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline cursor-pointer">
                      Mark read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto px-2 space-y-1.5">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-lg text-xs leading-relaxed transition-colors ${n.unread ? 'bg-primary/5 border border-primary/10' : 'bg-transparent'}`}>
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-semibold text-foreground">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{n.time}</span>
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
                className="flex items-center space-x-1 p-2 rounded-lg hover:bg-border/40 text-sm font-semibold cursor-pointer"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 z-40 flex items-center justify-around px-2">
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
          <div className="relative w-64 bg-card border-r border-border p-5 flex flex-col z-10">
            <div className="flex items-center justify-between pb-6 border-b border-border/40 mb-6">
              <span className="text-xl font-bold tracking-tight text-gradient">WELLSYNC</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-grow space-y-1.5 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
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
          <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg flex items-center space-x-4">
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">Critical Medical Disclosure</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This panel shows only critical alerts, allergies, and contacts. Access can be shared with first responders.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Blood Group</span>
                <p className="text-lg font-bold text-foreground">O + (Positive)</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Emergency Contact</span>
                <p className="text-sm font-semibold text-foreground">Emma Sompa (Spouse)</p>
                <p className="text-xs text-muted-foreground">+1-555-0911</p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confirmed Allergies</span>
              <p className="text-sm font-semibold text-red-400">Peanuts, Penicillin (Severe Anaphylaxis risk)</p>
            </div>

            <div className="border-t border-border/40 pt-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Configured Conditions</span>
              <p className="text-sm font-semibold text-foreground">Mild chronic blood pressure variance</p>
            </div>

            <div className="border-t border-border/40 pt-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Medications</span>
              <p className="text-sm text-foreground">None daily (except over-the-counter Multivitamins)</p>
            </div>

            <div className="border-t border-border/40 pt-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Important Notes</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Carries peanut allergen auto-injector (EpiPen) in backpack at all times.
              </p>
            </div>

            {/* QR Scanner Simulation */}
            <div className="border-t border-border/40 pt-4 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">QR Code Access Token</span>
              <div className="bg-white p-3 rounded-lg flex items-center justify-center border border-border">
                {/* Mock QR using Lucide Qrcode */}
                <div className="w-32 h-32 text-black flex items-center justify-center">
                  <div className="relative w-full h-full flex flex-col justify-between p-1">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-4 border-black"></div>
                      <div className="w-6 h-6 border-4 border-black"></div>
                    </div>
                    <div className="self-center font-mono font-bold text-[10px] uppercase text-slate-800 tracking-wider">WELLSYNC EMERGENCY</div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-4 border-black"></div>
                      <div className="w-6 h-6 border-4 border-black border-dashed"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 max-w-xs">
                First responders can scan this code to view the revocable emergency disclosure profile securely.
              </p>
              <Link
                href={`/emergency/tok_sompa_secure_emergency_access_key_xyz_789`}
                target="_blank"
                className="mt-3 text-xs text-primary font-semibold hover:underline"
              >
                View Public Emergency Card Page
              </Link>
            </div>
          </div>

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
