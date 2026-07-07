import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '@/src/lib/db';
import { signToken, __setCookieStoreForTests } from '@/src/lib/auth';
import { defaultPermissions } from '@/src/lib/permissions';

type CookieValue = { value: string };

const cookieJar = new Map<string, string>();

function installCookiesMock() {
  const cookieStore = async () => ({
    get: (name: string): CookieValue | undefined => {
      const value = cookieJar.get(name);
      return value ? { value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  });
  __setCookieStoreForTests(cookieStore as Parameters<typeof __setCookieStoreForTests>[0]);
}

function setSession(token: string, activeProfileId?: string) {
  cookieJar.set('wellsync_session', token);
  if (activeProfileId) cookieJar.set('wellsync_active_profile_id', activeProfileId);
  else cookieJar.delete('wellsync_active_profile_id');
}

function clearSession() {
  cookieJar.clear();
}

async function jsonResponse(res: Response) {
  return res.json().catch(() => null);
}

async function createFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ownerA = await prisma.user.create({
    data: { email: `owner-a-${suffix}@example.com`, password: 'pw', name: 'Owner A' },
  });
  const ownerB = await prisma.user.create({
    data: { email: `owner-b-${suffix}@example.com`, password: 'pw', name: 'Owner B' },
  });
  const caregiver = await prisma.user.create({
    data: { email: `caregiver-${suffix}@example.com`, password: 'pw', name: 'Caregiver' },
  });
  const viewer = await prisma.user.create({
    data: { email: `viewer-${suffix}@example.com`, password: 'pw', name: 'Viewer' },
  });

  const profileA = await prisma.familyProfile.create({
    data: { userId: ownerA.id, name: 'Profile A', relationship: 'SELF' },
  });
  const profileB = await prisma.familyProfile.create({
    data: { userId: ownerB.id, name: 'Profile B', relationship: 'SELF' },
  });

  const caregiverMember = await prisma.careCircleMember.create({
    data: {
      userId: caregiver.id,
      familyProfileId: profileA.id,
      email: caregiver.email,
      relationshipLabel: 'Trusted caregiver',
      role: 'caregiver',
      permissions: JSON.stringify({
        ...defaultPermissions('caregiver'),
        'appointments.view': true,
        'followups.view': true,
        'records.view': true,
      }),
      active: true,
      acceptedAt: new Date(),
    },
  });

  const viewerMember = await prisma.careCircleMember.create({
    data: {
      userId: viewer.id,
      familyProfileId: profileA.id,
      email: viewer.email,
      relationshipLabel: 'Viewer',
      role: 'viewer',
      permissions: JSON.stringify(defaultPermissions('viewer')),
      active: true,
      acceptedAt: new Date(),
    },
  });

  const doctorA = await prisma.doctor.create({
    data: { name: 'Dr A', specialty: 'Primary', clinic: 'Clinic A', contactInfo: 'a@example.com' },
  });
  const doctorB = await prisma.doctor.create({
    data: { name: 'Dr B', specialty: 'Primary', clinic: 'Clinic B', contactInfo: 'b@example.com' },
  });

  const sleepA = await prisma.sleepEntry.create({
    data: {
      familyProfileId: profileA.id,
      date: '2026-07-01',
      bedtime: new Date('2026-07-01T22:00:00Z'),
      wakeTime: new Date('2026-07-02T06:00:00Z'),
      durationMinutes: 480,
    },
  });
  const sleepB = await prisma.sleepEntry.create({
    data: {
      familyProfileId: profileB.id,
      date: '2026-07-01',
      bedtime: new Date('2026-07-01T23:00:00Z'),
      wakeTime: new Date('2026-07-02T07:00:00Z'),
      durationMinutes: 480,
    },
  });

  const weightA = await prisma.weightEntry.create({ data: { familyProfileId: profileA.id, weight: 70, date: '2026-07-01' } });
  const weightB = await prisma.weightEntry.create({ data: { familyProfileId: profileB.id, weight: 80, date: '2026-07-01' } });
  const activityA = await prisma.workoutEntry.create({ data: { familyProfileId: profileA.id, type: 'WALK', durationMinutes: 30, date: '2026-07-01' } });
  const activityB = await prisma.workoutEntry.create({ data: { familyProfileId: profileB.id, type: 'RUN', durationMinutes: 45, date: '2026-07-01' } });

  const medicationA = await prisma.medication.create({
    data: {
      familyProfileId: profileA.id,
      name: 'Med A',
      dosage: '500mg',
      unit: 'mg',
      frequency: 'DAILY',
      scheduleTimes: '08:00',
      startDate: '2026-07-01',
      active: true,
    },
  });
  const medicationB = await prisma.medication.create({
    data: {
      familyProfileId: profileB.id,
      name: 'Med B',
      dosage: '250mg',
      unit: 'mg',
      frequency: 'DAILY',
      scheduleTimes: '09:00',
      startDate: '2026-07-01',
      active: true,
    },
  });
  const medEventA = await prisma.medicationEvent.create({
    data: {
      familyProfileId: profileA.id,
      medicationId: medicationA.id,
      scheduledTime: new Date('2026-07-01T08:00:00Z'),
      status: 'PENDING',
    },
  });
  const medEventB = await prisma.medicationEvent.create({
    data: {
      familyProfileId: profileB.id,
      medicationId: medicationB.id,
      scheduledTime: new Date('2026-07-01T09:00:00Z'),
      status: 'PENDING',
    },
  });

  const appointmentA = await prisma.appointment.create({
    data: {
      familyProfileId: profileA.id,
      doctorId: doctorA.id,
      date: '2026-07-10',
      time: '10:00',
      status: 'PENDING',
      isVirtual: false,
    },
  });
  const appointmentB = await prisma.appointment.create({
    data: {
      familyProfileId: profileB.id,
      doctorId: doctorB.id,
      date: '2026-07-11',
      time: '11:00',
      status: 'PENDING',
      isVirtual: false,
    },
  });

  const followUpA = await prisma.followUpTask.create({
    data: {
      familyProfileId: profileA.id,
      appointmentId: appointmentA.id,
      title: 'Follow A',
      dueDate: '2026-07-20',
      status: 'pending',
    },
  });
  const followUpB = await prisma.followUpTask.create({
    data: {
      familyProfileId: profileB.id,
      appointmentId: appointmentB.id,
      title: 'Follow B',
      dueDate: '2026-07-21',
      status: 'pending',
    },
  });

  const recordA = await prisma.medicalRecord.create({
    data: {
      familyProfileId: profileA.id,
      appointmentId: appointmentA.id,
      title: 'Record A',
      category: 'OTHER',
      provider: 'Provider A',
      date: '2026-07-10',
      fileUrl: '/records/a',
    },
  });
  const recordB = await prisma.medicalRecord.create({
    data: {
      familyProfileId: profileB.id,
      appointmentId: appointmentB.id,
      title: 'Record B',
      category: 'OTHER',
      provider: 'Provider B',
      date: '2026-07-11',
      fileUrl: '/records/b',
    },
  });

  const timelineA = await prisma.timelineEvent.create({
    data: {
      familyProfileId: profileA.id,
      eventType: 'RECORD',
      eventId: recordA.id,
      title: 'Timeline A',
      description: 'A',
    },
  });
  const timelineB = await prisma.timelineEvent.create({
    data: {
      familyProfileId: profileB.id,
      eventType: 'RECORD',
      eventId: recordB.id,
      title: 'Timeline B',
      description: 'B',
    },
  });

  const handoffA = await prisma.caregiverHandoff.create({
    data: { familyProfileId: profileA.id, handoffDateTime: new Date('2026-07-12T10:00:00Z'), summary: 'handoff A' },
  });
  const handoffB = await prisma.caregiverHandoff.create({
    data: { familyProfileId: profileB.id, handoffDateTime: new Date('2026-07-13T10:00:00Z'), summary: 'handoff B' },
  });

  const emergencyProfile = await prisma.emergencyProfile.create({
    data: {
      familyProfileId: profileA.id,
      preferredName: 'Visible Name',
      bloodType: 'O+',
      allergies: 'Peanuts',
      criticalConditions: 'Asthma',
      currentMedications: 'Med A',
      primaryDoctor: 'Dr A',
      insuranceNote: 'Insurance',
      emergencyNote: 'Private note',
      publicFields: JSON.stringify(['preferredName', 'bloodType', 'contacts']),
      token: `public-token-${suffix}`,
      active: true,
    },
  });

  const invitation = await prisma.careCircleInvitation.create({
    data: {
      userId: ownerA.id,
      familyProfileId: profileA.id,
      email: 'invited@example.com',
      relationshipLabel: 'Invitee',
      role: 'caregiver',
      permissions: JSON.stringify(defaultPermissions('caregiver')),
      status: 'pending',
      token: `invite-token-${suffix}`,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  return {
    ownerA,
    ownerB,
    caregiver,
    viewer,
    profileA,
    profileB,
    caregiverMember,
    viewerMember,
    sleepA,
    sleepB,
    weightA,
    weightB,
    activityA,
    activityB,
    medicationA,
    medicationB,
    medEventA,
    medEventB,
    appointmentA,
    appointmentB,
    followUpA,
    followUpB,
    recordA,
    recordB,
    timelineA,
    timelineB,
    handoffA,
    handoffB,
    emergencyProfile,
    invitation,
  };
}

async function cleanupFixture(fixture: Awaited<ReturnType<typeof createFixture>>) {
  await prisma.$transaction([
    prisma.emergencyAccessLog.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.emergencyProfile.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.caregiverHandoff.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.medicalRecord.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.followUpTask.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.appointment.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.medicationEvent.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.medication.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.timelineEvent.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.workoutEntry.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.weightEntry.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.sleepEntry.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.careCircleMember.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.careCircleInvitation.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.doctor.deleteMany({ where: { id: { in: [fixture.appointmentA.doctorId, fixture.appointmentB.doctorId] } } }),
    prisma.familyProfile.deleteMany({ where: { id: { in: [fixture.profileA.id, fixture.profileB.id] } } }),
    prisma.user.deleteMany({ where: { id: { in: [fixture.ownerA.id, fixture.ownerB.id, fixture.caregiver.id, fixture.viewer.id] } } }),
  ]);
}

async function callRoute(routePath: string, exportName: 'GET' | 'POST' | 'PATCH' | 'DELETE', requestUrl: string, init: RequestInit = {}, params?: Record<string, string>) {
  const route = await import(routePath);
  const handler = route[exportName] as (req: Request, ctx?: { params: Promise<Record<string, string>> }) => Promise<Response>;
  const req = new Request(requestUrl, init);
  return handler(req, params ? { params: Promise.resolve(params) } : undefined);
}

beforeEach(() => {
  installCookiesMock();
  clearSession();
});

afterEach(() => {
  clearSession();
  __setCookieStoreForTests(null);
});

test('authorization routes deny revoked caregiver access immediately', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.caregiver.id, email: fixture.caregiver.email, name: fixture.caregiver.name });
  setSession(token, fixture.profileA.id);

  const allowed = await callRoute('./../app/api/sleep/route', 'GET', 'http://localhost/api/sleep');
  assert.equal(allowed.status, 200);

  await prisma.careCircleMember.update({ where: { id: fixture.caregiverMember.id }, data: { active: false, revokedAt: new Date() } });

  const denied = await callRoute('./../app/api/sleep/route', 'GET', 'http://localhost/api/sleep');
  assert.equal(denied.status, 403);
});

test('cross-profile IDOR is denied for appointments, records, medication events, and handoffs', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.caregiver.id, email: fixture.caregiver.email, name: fixture.caregiver.name });
  setSession(token, fixture.profileA.id);

  const appointment = await callRoute('./../app/api/appointments/[id]/route', 'GET', `http://localhost/api/appointments/${fixture.appointmentB.id}`, {}, { id: fixture.appointmentB.id });
  assert.equal(appointment.status, 404);

  const record = await callRoute('./../app/api/records/[id]/route', 'GET', `http://localhost/api/records/${fixture.recordB.id}`, {}, { id: fixture.recordB.id });
  assert.equal(record.status, 404);

  const medEvent = await callRoute('./../app/api/medications/events/[eventId]/route', 'PATCH', `http://localhost/api/medications/events/${fixture.medEventB.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'TAKEN' }) }, { eventId: fixture.medEventB.id });
  assert.equal(medEvent.status, 404);

  const handoff = await callRoute('./../app/api/care-circle/handoffs/[id]/route', 'PATCH', `http://localhost/api/care-circle/handoffs/${fixture.handoffB.id}`, { method: 'PATCH' }, { id: fixture.handoffB.id });
  assert.equal(handoff.status, 404);
});

test('view permission does not imply write for appointments and records', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.viewer.id, email: fixture.viewer.email, name: fixture.viewer.name });
  setSession(token, fixture.profileA.id);

  const appointments = await callRoute('./../app/api/appointments/route', 'GET', 'http://localhost/api/appointments');
  assert.equal(appointments.status, 200);

  const createAppointment = await callRoute('./../app/api/appointments/route', 'POST', 'http://localhost/api/appointments', {
    method: 'POST',
    body: JSON.stringify({ date: '2026-07-15', time: '12:00', doctorId: fixture.appointmentA.doctorId }),
  });
  assert.equal(createAppointment.status, 403);

  const recordsCreate = await callRoute('./../app/api/records/route', 'POST', 'http://localhost/api/records', {
    method: 'POST',
    body: JSON.stringify({ title: 'x', category: 'OTHER', date: '2026-07-01', provider: 'p' }),
  });
  assert.equal(recordsCreate.status, 403);
});

test('medication event permission does not allow medication definition changes', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.caregiver.id, email: fixture.caregiver.email, name: fixture.caregiver.name });
  setSession(token, fixture.profileA.id);

  const read = await callRoute('./../app/api/medications/route', 'GET', 'http://localhost/api/medications');
  assert.equal(read.status, 200);

  const mutateDefinition = await callRoute('./../app/api/medications/[id]/route', 'PATCH', `http://localhost/api/medications/${fixture.medicationA.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ dosage: '999mg' }),
  }, { id: fixture.medicationA.id });
  assert.equal(mutateDefinition.status, 403);

  const eventPatch = await callRoute('./../app/api/medications/events/[eventId]/route', 'PATCH', `http://localhost/api/medications/events/${fixture.medEventA.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'TAKEN' }),
  }, { eventId: fixture.medEventA.id });
  assert.equal(eventPatch.status, 200);
});

test('emergency public route limits leakage to visible fields only', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const res = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${fixture.emergencyProfile.token}`, {}, { token: fixture.emergencyProfile.token });
  assert.equal(res.status, 200);
  const body = await jsonResponse(res);
  assert.equal(body.preferredName, 'Visible Name');
  assert.equal(body.bloodType, 'O+');
  assert.equal(body.emergencyNote, null);
  assert.equal(body.id, undefined);
  assert.deepEqual(body.contacts, []);
});

