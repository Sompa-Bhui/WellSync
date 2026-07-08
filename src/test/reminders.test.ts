import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '@/src/lib/db';
import { signToken, __setCookieStoreForTests } from '@/src/lib/auth';
import { computeNextTriggerAt, parseReminderRecurrence, processDueReminders } from '@/src/lib/reminders';
const db = prisma;

type CookieValue = { value: string };

const cookieJar = new Map<string, string>();

function installCookiesMock() {
  const cookieStore = async () => ({
    get: (name: string): CookieValue | undefined => {
      const value = cookieJar.get(name);
      return value ? { value } : undefined;
    },
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  });
  __setCookieStoreForTests(cookieStore as unknown as Parameters<typeof __setCookieStoreForTests>[0]);
}

function setSession(token: string, activeProfileId?: string) {
  cookieJar.set('wellsync_session', token);
  if (activeProfileId) cookieJar.set('wellsync_active_profile_id', activeProfileId);
}

async function fixture() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user = await prisma.user.create({ data: { email: `rem-${suffix}@example.com`, password: 'pw', name: 'Reminder' } });
  const profile = await prisma.familyProfile.create({ data: { userId: user.id, name: 'Reminder Profile', relationship: 'SELF' } });
  return { user, profile };
}

async function cleanup({ user, profile }: Awaited<ReturnType<typeof fixture>>) {
  await prisma.notification.deleteMany({ where: { familyProfileId: profile.id } });
  await prisma.reminder.deleteMany({ where: { familyProfileId: profile.id } });
  await prisma.familyProfile.deleteMany({ where: { id: profile.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
}

beforeEach(() => {
  installCookiesMock();
  cookieJar.clear();
});

afterEach(() => {
  cookieJar.clear();
  __setCookieStoreForTests(null);
});

test('deterministic reminder scheduling advances and deduplicates notifications', async (t) => {
  const data = await fixture();
  t.after(() => cleanup(data));

  await db.reminder.create({
    data: {
      familyProfileId: data.profile.id,
      createdByUserId: data.user.id,
      sourceType: 'CUSTOM',
      sourceId: `custom-${data.profile.id}`,
      reminderType: 'CUSTOM',
      title: 'Take a break',
      scheduledAt: new Date('2026-07-08T09:00:00Z'),
      timezone: 'UTC',
      recurrence: JSON.stringify({ type: 'DAILY', intervalDays: 1 }),
      enabled: true,
      nextTriggerAt: new Date('2026-07-08T09:00:00Z'),
    },
  });

  await processDueReminders({ now: new Date('2026-07-08T09:05:00Z'), familyProfileId: data.profile.id });

  const notificationCount = await db.notification.count({ where: { familyProfileId: data.profile.id } });
  assert.equal(notificationCount, 1);

  await processDueReminders({ now: new Date('2026-07-08T09:05:00Z'), familyProfileId: data.profile.id });

  const notificationCountAfter = await db.notification.count({ where: { familyProfileId: data.profile.id } });
  assert.equal(notificationCountAfter, 1);
});

test('notification APIs are profile-scoped and support read-all', async (t) => {
  const data = await fixture();
  t.after(() => cleanup(data));

  const token = signToken({ userId: data.user.id, email: data.user.email, name: data.user.name });
  setSession(token, data.profile.id);

  await db.notification.create({
    data: {
      userId: data.user.id,
      familyProfileId: data.profile.id,
      title: 'Reminder ready',
      message: 'Hydration reminder',
      category: 'REMINDER',
      notificationType: 'CUSTOM',
      sourceType: 'CUSTOM',
      sourceId: 'n1',
      dedupKey: `dedup-${Date.now()}`,
      isRead: false,
      timestamp: new Date(),
    },
  });

  const listModule = await import('./../app/api/notifications/route');
  const listRes = await listModule.GET(new Request('http://localhost/api/notifications') as unknown as Parameters<typeof listModule.GET>[0]);
  assert.equal(listRes.status, 200);
  const body = await listRes.json();
  assert.equal(body.unreadCount, 1);
  assert.equal(body.notifications.length, 1);

  const readAllModule = await import('./../app/api/notifications/read-all/route');
  const readAllRes = await readAllModule.POST();
  assert.equal(readAllRes.status, 200);

  const updatedCount = await db.notification.count({ where: { familyProfileId: data.profile.id, isRead: false } });
  assert.equal(updatedCount, 0);
});

test('recurrence parser and scheduler handle malformed input safely', () => {
  const recurrence = parseReminderRecurrence('not-json');
  assert.deepEqual(recurrence, { type: 'NONE' });
  const next = computeNextTriggerAt(new Date('2026-07-08T10:00:00Z'), new Date('2026-07-08T09:00:00Z'), { type: 'DAILY', intervalDays: 1 });
  assert.equal(next.toISOString(), '2026-07-09T09:00:00.000Z');
});
