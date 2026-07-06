'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Check } from 'lucide-react';
import { Card, Input, Select, Button } from '@/src/components/ui/primitives';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('SEDENTARY');
  const [dietaryPreference, setDietaryPreference] = useState('OMNIVORE');
  const [allergies, setAllergies] = useState('');
  const [foodRestrictions, setFoodRestrictions] = useState('');
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [sleepWakeTime, setSleepWakeTime] = useState('06:30');
  const [sleepBedTime, setSleepBedTime] = useState('22:30');
  const [preferredUnits, setPreferredUnits] = useState('METRIC');
  const [customGoal, setCustomGoal] = useState('');

  const preConfiguredGoals = [
    'Maintain current weight',
    'Gradual weight management',
    'Healthy weight gain',
    'Improve meal consistency',
    'Improve protein consistency',
    'Improve fiber intake',
    'Improve hydration',
    'General balanced eating'
  ];

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const toggleGoal = (goal: string) => {
    if (healthGoals.includes(goal)) {
      setHealthGoals(healthGoals.filter((g) => g !== goal));
    } else {
      setHealthGoals([...healthGoals, goal]);
    }
  };

  const handleAddCustomGoal = () => {
    if (customGoal.trim() && !healthGoals.includes(customGoal.trim())) {
      setHealthGoals([...healthGoals, customGoal.trim()]);
      setCustomGoal('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateOfBirth,
          height: height ? parseFloat(height) : null,
          targetWeight: targetWeight ? parseFloat(targetWeight) : null,
          activityLevel,
          dietaryPreference,
          allergies,
          foodRestrictions,
          healthGoals: healthGoals.join(', '),
          sleepWakeTime,
          sleepBedTime,
          preferredUnits,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to save profile. Please verify your fields.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving your profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-8">
      <div className="flex items-center space-x-2 mb-6">
        <ShieldAlert className="w-8 h-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight text-gradient">WELLSYNC</span>
      </div>

      <Card className="max-w-2xl w-full border border-border/80 bg-card p-8 shadow-xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-4">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step {step} of 3</span>
            <h2 className="text-xl font-bold text-foreground">
              {step === 1 && 'Vitals & Measurements'}
              {step === 2 && 'Dietary Preferences & Allergies'}
              {step === 3 && 'Lifestyles & Care Goals'}
            </h2>
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: VITALS */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              These details help calculate nutritional targets and tracking baseline statistics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />

              <Select
                label="Preferred System"
                options={[
                  { value: 'METRIC', label: 'Metric (cm, kg, ml)' },
                  { value: 'IMPERIAL', label: 'Imperial (in, lbs, oz)' },
                ]}
                value={preferredUnits}
                onChange={(e) => setPreferredUnits(e.target.value)}
              />

              <Input
                label={preferredUnits === 'METRIC' ? 'Height (cm)' : 'Height (inches)'}
                type="number"
                placeholder={preferredUnits === 'METRIC' ? '175' : '69'}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />

              <Input
                label={preferredUnits === 'METRIC' ? 'Target Weight (kg)' : 'Target Weight (lbs)'}
                type="number"
                placeholder={preferredUnits === 'METRIC' ? '68' : '150'}
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end pt-6">
              <Button onClick={() => setStep(2)}>Next Step</Button>
            </div>
          </div>
        )}

        {/* STEP 2: DIETARY */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Define your dietary baseline. Excluded foods will generate automated allergen flags across meals.
            </p>

            <div className="space-y-4">
              <Select
                label="Dietary Base Preference"
                options={[
                  { value: 'OMNIVORE', label: 'Omnivore (No restrictions)' },
                  { value: 'VEGETARIAN', label: 'Vegetarian' },
                  { value: 'VEGAN', label: 'Vegan' },
                  { value: 'EGGETARIAN', label: 'Eggetarian' },
                  { value: 'CUSTOM', label: 'Custom' },
                ]}
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
              />

              <Input
                label="Confirmed Allergies (Comma Separated)"
                placeholder="e.g. Peanuts, Dairy, Shellfish"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
              <span className="text-[10px] text-muted-foreground -mt-2 block">
                IMPORTANT: Excluded allergens will show alerts when logging matching foods.
              </span>

              <Input
                label="Explicit Food Restrictions"
                placeholder="e.g. High-sodium foods, Caffeine, Gluten"
                value={foodRestrictions}
                onChange={(e) => setFoodRestrictions(e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Next Step</Button>
            </div>
          </div>
        )}

        {/* STEP 3: LIFESTYLE GOALS */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Define your care goals and lifestyle targets. These configure custom hydration plans and sleep intervals.
            </p>

            <div className="space-y-4">
              <Select
                label="Typical Physical Activity Level"
                options={[
                  { value: 'SEDENTARY', label: 'Sedentary (Little/no exercise)' },
                  { value: 'LIGHTLY_ACTIVE', label: 'Lightly Active (1-3 days/week)' },
                  { value: 'MODERATELY_ACTIVE', label: 'Moderately Active (3-5 days/week)' },
                  { value: 'VERY_ACTIVE', label: 'Very Active (6-7 days/week)' },
                ]}
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Target Bedtime"
                  type="time"
                  value={sleepBedTime}
                  onChange={(e) => setSleepBedTime(e.target.value)}
                />
                <Input
                  label="Target Wake Time"
                  type="time"
                  value={sleepWakeTime}
                  onChange={(e) => setSleepWakeTime(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2 block">
                  Select Care/Lifestyle Goals (Check all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {preConfiguredGoals.map((goal) => {
                    const isSelected = healthGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-sm text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary/5 border-primary text-primary font-semibold'
                            : 'bg-background border-border/80 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </span>
                        <span className="truncate">{goal}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Or enter custom goal..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomGoal())}
                />
                <Button variant="secondary" onClick={handleAddCustomGoal} className="shrink-0 self-end">
                  Add Goal
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-border/40 mt-6">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSubmit} isLoading={loading}>
                Finish Setup
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
