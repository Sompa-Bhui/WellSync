'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Input, Button, Card } from '@/src/components/ui/primitives';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to onboarding
        router.push('/onboarding');
      } else {
        setError(data.error || 'Registration failed');
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
        <h2 className="text-2xl font-bold text-foreground text-center mb-1.5">Create Account</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Begin managing your personal & family care plan
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3.5 mb-6 text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            type="text"
            placeholder="John Sompa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

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
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <div className="pt-2">
            <Button type="submit" className="w-full" isLoading={loading}>
              Get Started
            </Button>
          </div>
        </form>

        <div className="border-t border-border/40 mt-6 pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
