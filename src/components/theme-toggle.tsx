'use client';

import type { ComponentType } from 'react';
import { Monitor, MoonStar, SunMedium } from 'lucide-react';
import { Button } from '@/src/components/ui/primitives';
import { useTheme } from '@/src/components/theme-provider';
import type { ThemePreference } from '@/src/lib/theme';

const OPTIONS: { value: ThemePreference; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: SunMedium },
  { value: 'dark', label: 'Dark', icon: MoonStar },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size={compact ? 'sm' : 'sm'}
            onClick={() => setTheme(option.value)}
            aria-label={`Set theme to ${option.label}`}
            title={`Theme: ${option.label}`}
            className={`min-w-0 px-2.5 ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'}`}
          >
            <Icon className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
      <span className="sr-only">Resolved theme: {resolvedTheme}</span>
    </div>
  );
}
