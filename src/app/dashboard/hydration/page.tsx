'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Card, Button, Input } from '@/src/components/ui/primitives';
import { Droplet, Plus, Trash2, Calendar, Coffee, Sparkles } from 'lucide-react';

export default function HydrationPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchWater = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/water?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWater();
  }, [date]);

  const handleQuickAdd = async (amount: number) => {
    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          timestamp: new Date(`${date}T${new Date().toTimeString().split(' ')[0]}Z`).toISOString(),
        }),
      });

      if (res.ok) {
        fetchWater();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmount) return;
    setFormLoading(true);

    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(customAmount),
          timestamp: new Date(`${date}T12:00:00Z`).toISOString(),
        }),
      });

      if (res.ok) {
        setCustomAmount('');
        fetchWater();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const totalWater = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const targetWater = 2500; // 2.5L default target
  const progressPercent = Math.min((totalWater / targetWater) * 100, 100);

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-4 border-b border-border/40">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Hydration Workspace</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient mt-1">Water Tracking</h1>
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

        {/* Status Circular Indicator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center justify-center p-8 text-center md:col-span-1">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer circle progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" stroke="#1f2937" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#06b6d4"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="276.4"
                  strokeDashoffset={276.4 - (276.4 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <Droplet className="w-8 h-8 text-secondary mb-1" />
                <span className="text-2xl font-black text-foreground">{(totalWater / 1000).toFixed(2)}L</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">of {targetWater / 1000}L Goal</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
              {progressPercent >= 100 ? (
                <span className="text-success font-semibold flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Daily goal achieved!
                </span>
              ) : (
                <span>Remaining: {((targetWater - totalWater) / 1000).toFixed(2)} Liters</span>
              )}
            </div>
          </Card>

          {/* Quick Logs Control Panel */}
          <Card className="md:col-span-2 flex flex-col justify-between p-6">
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">Quick Hydrate</h3>
              <p className="text-xs text-muted-foreground mb-6">Select a pre-configured intake size to instantly add to today&apos;s log.</p>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleQuickAdd(100)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-background hover:border-secondary hover:text-secondary transition-all cursor-pointer"
                >
                  <Coffee className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm font-bold text-foreground">100 ml</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Espresso cup</span>
                </button>

                <button
                  onClick={() => handleQuickAdd(250)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-background hover:border-secondary hover:text-secondary transition-all cursor-pointer"
                >
                  <Droplet className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm font-bold text-foreground">250 ml</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Glass cup</span>
                </button>

                <button
                  onClick={() => handleQuickAdd(500)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-background hover:border-secondary hover:text-secondary transition-all cursor-pointer"
                >
                  <Droplet className="w-6 h-6 text-secondary mb-2" />
                  <span className="text-sm font-bold text-foreground">500 ml</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Sports Bottle</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCustomAdd} className="flex items-end space-x-3 pt-6 border-t border-border/40 mt-6">
              <div className="flex-1">
                <Input
                  label="Log Custom Intake Amount"
                  type="number"
                  placeholder="e.g. 350"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" isLoading={formLoading} className="px-6 self-end">
                Log (ml)
              </Button>
            </form>
          </Card>
        </div>

        {/* History timeline list */}
        <Card className="max-w-2xl w-full">
          <h3 className="text-base font-bold text-foreground pb-3 border-b border-border/40 mb-4 flex items-center">
            <Droplet className="w-5 h-5 text-secondary mr-2" />
            Hydration Timeline
          </h3>

          <div className="space-y-4">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3.5 rounded-lg bg-background border border-border/60">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-full bg-secondary/10 text-secondary">
                      <Droplet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{entry.amount} ml</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Logged at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground italic">{entry.beverageType}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground italic">
                No water entries logged for this date
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
