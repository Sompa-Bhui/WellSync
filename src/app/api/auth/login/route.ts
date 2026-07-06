import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { comparePassword, signToken, setSession, getActiveProfile, setActiveProfile } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get active family profile or create it if missing
    const activeProfile = await getActiveProfile(user.id);

    // Create token
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Set session cookies
    await setSession(token);
    await setActiveProfile(activeProfile.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile: activeProfile,
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
