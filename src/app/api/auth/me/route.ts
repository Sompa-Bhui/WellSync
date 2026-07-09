import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        healthProfile: user.healthProfile,
        familyProfiles: user.familyProfiles,
      },
      activeProfile,
    });
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Me API PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
