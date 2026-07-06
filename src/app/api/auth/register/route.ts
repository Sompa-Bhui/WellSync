import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { hashPassword, signToken, setSession, setActiveProfile } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      },
    });

    // Create default SELF family profile
    const selfProfile = await prisma.familyProfile.create({
      data: {
        userId: user.id,
        name: user.name,
        relationship: 'SELF',
      },
    });

    // Create token
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Set cookies
    await setSession(token);
    await setActiveProfile(selfProfile.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile: selfProfile,
    });
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
