'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: any;
  activeProfile: any;
  familyProfiles: any[];
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [familyProfiles, setFamilyProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setActiveProfile(data.activeProfile);
        
        // Fetch full family profiles list
        const familyRes = await fetch('/api/family');
        if (familyRes.ok) {
          const familyData = await familyRes.json();
          setFamilyProfiles(familyData);
        } else {
          setFamilyProfiles(data.user.familyProfiles || []);
        }
      } else {
        setUser(null);
        setActiveProfile(null);
        setFamilyProfiles([]);
        
        // If on protected page, redirect to login
        if (pathname.startsWith('/dashboard')) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const switchProfile = async (profileId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/family/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProfile(data.activeProfile);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to switch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setActiveProfile(null);
      setFamilyProfiles([]);
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        familyProfiles,
        isLoading,
        refreshSession: fetchSession,
        switchProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
