import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'wellsync-development-secret-key-987654321';
const COOKIE_NAME = 'wellsync_session';
const ACTIVE_PROFILE_COOKIE = 'wellsync_active_profile_id';
type CookieStore = Awaited<ReturnType<typeof cookies>>;
let cookieStoreOverride: (() => Promise<CookieStore> | CookieStore) | null = null;

export function __setCookieStoreForTests(factory: (() => Promise<CookieStore> | CookieStore) | null) {
  cookieStoreOverride = factory;
}

async function getCookieStore() {
  if (cookieStoreOverride) return await cookieStoreOverride();
  return await cookies();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | string | null {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await getCookieStore();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || typeof payload === 'string' || !('userId' in payload)) return null;

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
  const cookieStore = await getCookieStore();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await getCookieStore();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(ACTIVE_PROFILE_COOKIE);
}

export async function __readCookieValue(name: string) {
  const cookieStore = await getCookieStore();
  return cookieStore.get(name)?.value ?? null;
}

export async function getActiveProfile(userId: string) {
  const cookieStore = await getCookieStore();
  const activeProfileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;

  if (activeProfileId) {
    const ownedProfile = await prisma.familyProfile.findFirst({
      where: { id: activeProfileId, userId },
    });
    if (ownedProfile) return ownedProfile;

    const sharedProfile = await prisma.familyProfile.findFirst({
      where: {
        id: activeProfileId,
        careCircleMembers: {
          some: {
            userId,
            active: true,
          },
        },
      },
    });
    if (sharedProfile) return sharedProfile;
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
  const cookieStore = await getCookieStore();
  const user = await getSessionUser();
  if (user) {
    const owned = await prisma.familyProfile.findFirst({ where: { id: profileId, userId: user.id } });
    if (owned) {
      cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return;
    }

    const shared = await prisma.careCircleMember.findFirst({
      where: { familyProfileId: profileId, userId: user.id, active: true },
    });
    if (!shared) {
      return;
    }
  }
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}
