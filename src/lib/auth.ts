import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'wellsync-development-secret-key-987654321';
const COOKIE_NAME = 'wellsync_session';
const ACTIVE_PROFILE_COOKIE = 'wellsync_active_profile_id';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        healthProfile: true,
        familyProfiles: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching session user:', error);
    return null;
  }
}

export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(ACTIVE_PROFILE_COOKIE);
}

export async function getActiveProfile(userId: string) {
  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;

  if (activeProfileId) {
    const profile = await prisma.familyProfile.findFirst({
      where: {
        id: activeProfileId,
        userId: userId,
      },
    });
    if (profile) return profile;
  }

  // Fallback to "Self" profile or first profile
  let selfProfile = await prisma.familyProfile.findFirst({
    where: {
      userId: userId,
      relationship: 'SELF',
    },
  });

  if (!selfProfile) {
    // Check if any profile exists
    selfProfile = await prisma.familyProfile.findFirst({
      where: { userId: userId },
    });
  }

  if (!selfProfile) {
    // Create default self profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    selfProfile = await prisma.familyProfile.create({
      data: {
        userId: userId,
        name: user?.name || 'Self',
        relationship: 'SELF',
      },
    });
  }

  return selfProfile;
}

export async function setActiveProfile(profileId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}
