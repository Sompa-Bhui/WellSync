'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Input, Button, Card } from '@/src/components/ui/primitives';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.push('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-12">
      <div className="flex items-center space-x-2.5 mb-8">
        <ShieldAlert className="w-10 h-10 text-primary animate-pulse" />
        <span className="text-3xl font-extrabold tracking-tight text-gradient">WELLSYNC</span>
      </div>

      <Card className="max-w-md w-full p-8 border border-border bg-card shadow-2xl">
        <h2 className="text-2xl font-bold text-foreground text-center mb-1.5">Sign In to WellSync</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Access your unified health & care environment
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3.5 mb-6 text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="pt-2">
            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </div>
        </form>

        <div className="border-t border-border/40 mt-6 pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </Card>
      
      <p className="text-[10px] text-muted-foreground mt-8 max-w-xs text-center leading-relaxed">
        WellSync is a privacy-conscious personal health management platform. Your medical history remains secure.
      </p>
    </div>
  );
}
