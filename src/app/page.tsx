'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Heart, Activity, ClipboardList, Share2, HelpCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/primitives';

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-2xl font-extrabold tracking-tight text-gradient">WELLSYNC</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/20 mb-8">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary tracking-wider uppercase">Connected Health Workspace</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Synchronize Your Personal Health & <span className="text-gradient">Family Care</span>
        </h1>
        
        <p className="text-base sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-10">
          A unified, privacy-conscious health companion combining nutrition, hydration, sleep, weight trends, medical records vault, medications, and caregiver coordination in one secure interface.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto font-semibold">
              Launch Application
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto font-semibold">
              Create Free Account
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left pt-12 border-t border-border/40">
          <div className="space-y-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/20 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Advanced Tracking</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Log foods, hydration timelines, sleep consistency, weight trends, and exercises. Visualize your progress with interactive, responsive charts.
            </p>
          </div>

          <div className="space-y-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/5 flex items-center justify-center border border-secondary/20 text-secondary">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Appointments & Medications</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plan clinical visits, prepare checklist documents, track follow-up schedules, and log taken/skipped daily doses with detailed adherence summaries.
            </p>
          </div>

          <div className="space-y-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center border border-accent/20 text-accent">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Care Circles</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Manage family sub-profiles, delegate permission access (caregivers, family admin), and generate secure public emergency cards with QR codes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 bg-card/20">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground tracking-wider">WELLSYNC</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <span>Privacy-conscious architecture</span>
            <span>Local Database Storage</span>
            <span>Zero Data Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
