import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, setActiveProfile } from '@/src/lib/auth';
import { resolveProfileAccess } from '@/src/lib/authorization';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const access = await resolveProfileAccess(user.id, profileId);
    if (!access) return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 });

    await setActiveProfile(profileId);

    return NextResponse.json({ success: true, activeProfile: access.familyProfile });
  } catch (error) {
    console.error('Active profile swapper error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
