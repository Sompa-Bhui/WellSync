'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import DashboardShell from '@/src/components/DashboardShell';
import { Card, Button } from '@/src/components/ui/primitives';
import {
  Apple,
  Droplet,
  Moon,
  Scale,
  Activity,
  Pill,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { activeProfile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/overview?date=${date}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [date, activeProfile]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="h-10 bg-card rounded-lg w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-card rounded-xl border border-border animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-card rounded-xl border border-border lg:col-span-2 animate-pulse" />
            <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!data) return null;

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Workspace Dashboard</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
              Health Overview
            </h1>
          </div>
          
          <div className="flex items-center space-x-3 bg-card border border-border/80 rounded-lg p-1">
            <input
              type="date"
              className="bg-transparent border-none text-sm text-foreground focus:outline-none px-2 py-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Needs Attention / Alerts Panel */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-5 flex items-start space-x-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-amber-400">Needs Attention</h4>
              <ul className="space-y-1">
                {data.alerts.map((alert: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground list-disc list-inside">
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 4 Cards Grid (Vitals Summary) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Nutrition */}
          <Card className="flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nutrition</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {data.nutrition.summary.calories} <span className="text-xs font-normal text-muted-foreground">/ {data.nutrition.targetCalories} kcal</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 text-primary">
                <Apple className="w-5 h-5" />
              </div>
            </div>
            
            {/* Macro Bars */}
            <div className="space-y-2 mt-4">
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${Math.min((data.nutrition.summary.calories / data.nutrition.targetCalories) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Protein: {data.nutrition.summary.protein}g / {data.nutrition.targetProtein}g</span>
                <span>Carbs: {data.nutrition.summary.carbs}g</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Hydration */}
          <Card className="flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hydration</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {(data.hydration.total / 1000).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ {(data.hydration.target / 1000).toFixed(1)} L</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-secondary/5 border border-secondary/20 text-secondary">
                <Droplet className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-secondary h-1.5 rounded-full"
                  style={{ width: `${Math.min((data.hydration.total / data.hydration.target) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {data.hydration.total >= data.hydration.target ? 'Hydration goal achieved!' : `${data.hydration.target - data.hydration.total} ml remaining`}
              </span>
            </div>
          </Card>

          {/* Card 3: Sleep */}
          <Card className="flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sleep</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {data.sleep ? `${data.sleep.durationHours}h ${data.sleep.durationMinutes}m` : '--'}
                  <span className="text-xs font-normal text-muted-foreground"> / 8h target</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-accent/5 border border-accent/20 text-accent">
                <Moon className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {data.sleep ? (
                <>
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-accent h-1.5 rounded-full"
                      style={{ width: `${Math.min(((data.sleep.durationHours * 60 + data.sleep.durationMinutes) / 480) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground block">Rest levels normal</span>
                </>
              ) : (
                <span className="text-[10px] text-muted-foreground block italic">No sleep logged for today</span>
              )}
            </div>
          </Card>

          {/* Card 4: Weight */}
          <Card className="flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Body Weight</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {data.vitals.currentWeight ? `${data.vitals.currentWeight} kg` : '--'}
                  <span className="text-xs font-normal text-muted-foreground"> target: {data.vitals.targetWeight || '--'} kg</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-success">
                <Scale className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-1.5 mt-4">
              {data.vitals.currentWeight && data.vitals.targetWeight ? (
                <div className="flex items-center text-[10px] text-muted-foreground space-x-1">
                  <TrendingDown className="w-3.5 h-3.5 text-success" />
                  <span>Remaining: {(data.vitals.currentWeight - data.vitals.targetWeight).toFixed(1)} kg</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground block italic">Configure target weight in settings</span>
              )}
            </div>
          </Card>
        </div>

        {/* Action Blocks & Appointment Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Medications checklist */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
              <div className="flex items-center space-x-2">
                <Pill className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Today&apos;s Medications</h3>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {data.medications.completed} of {data.medications.total} taken
              </span>
            </div>

            <div className="space-y-3.5">
              {data.medications.events && data.medications.events.length > 0 ? (
                data.medications.events.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3.5 rounded-lg bg-background border border-border/60">
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className={`p-1.5 rounded-lg mt-0.5 ${
                        event.status === 'TAKEN' ? 'bg-success/10 text-success' : 'bg-amber-950/20 text-warning'
                      }`}>
                        {event.status === 'TAKEN' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{event.medication.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Dosage: {event.medication.dosage} · Scheduled: {new Date(event.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                        event.status === 'TAKEN' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground italic">
                  No medications scheduled for this profile today
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/40 flex justify-end">
              <Link href="/dashboard/medications" className="inline-flex items-center text-xs font-semibold text-primary hover:underline">
                Manage medications schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </Card>

          {/* Next Doctor Appointment */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-4 border-b border-border/40 mb-4">
                <Calendar className="w-5 h-5 text-secondary" />
                <h3 className="text-base font-bold text-foreground">Next Appointment</h3>
              </div>

              {data.nextAppointment ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider">Confirmed</p>
                    <p className="text-lg font-bold text-foreground">{data.nextAppointment.doctorName}</p>
                    <p className="text-sm text-muted-foreground">{data.nextAppointment.specialty}</p>
                    <p className="text-xs text-muted-foreground">{data.nextAppointment.clinic}</p>
                  </div>
                  
                  <div className="p-3.5 rounded-lg bg-background border border-border/60">
                    <p className="text-xs text-muted-foreground">Appointment Scheduled For</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {new Date(data.nextAppointment.date).toLocaleDateString([], { month: 'long', day: 'numeric' })} at {data.nextAppointment.time}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground italic">
                  No upcoming clinical appointments scheduled
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/40">
              <Link href="/dashboard/appointments" className="w-full">
                <Button variant="secondary" size="sm" className="w-full">
                  Appointments Center
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
