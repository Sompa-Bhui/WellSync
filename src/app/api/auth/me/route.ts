import { NextResponse } from 'next/server';
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
