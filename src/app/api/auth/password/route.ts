import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, getSessionUser, hashPassword } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    const confirmPassword = String(body.confirmPassword || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const valid = await comparePassword(currentPassword, dbUser.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const password = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
