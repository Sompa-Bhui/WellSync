import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '@/src/lib/db';
import { signToken, __setCookieStoreForTests, hashPassword } from '@/src/lib/auth';
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
    data: { email: `owner-a-${suffix}@example.com`, password: await hashPassword('pw'), name: 'Owner A' },
  });
  const ownerB = await prisma.user.create({
    data: { email: `owner-b-${suffix}@example.com`, password: await hashPassword('pw'), name: 'Owner B' },
  });
  const caregiver = await prisma.user.create({
    data: { email: `caregiver-${suffix}@example.com`, password: await hashPassword('pw'), name: 'Caregiver' },
  });
  const viewer = await prisma.user.create({
    data: { email: `viewer-${suffix}@example.com`, password: await hashPassword('pw'), name: 'Viewer' },
  });
  const invitee = await prisma.user.create({
    data: { email: `invited-${suffix}@example.com`, password: await hashPassword('pw'), name: 'Invitee' },
  });
  const stranger = await prisma.user.create({
    data: { email: `stranger-${suffix}@example.com`, password: await hashPassword('pw'), name: 'Stranger' },
  });
  const profileA = await prisma.familyProfile.create({
    data: { userId: ownerA.id, name: 'Profile A', relationship: 'SELF' },
  });
  await prisma.healthProfile.create({
    data: {
      userId: ownerA.id,
      dateOfBirth: '1990-01-01',
      height: 175,
      targetWeight: 70,
      activityLevel: 'MODERATELY_ACTIVE',
      dietaryPreference: 'OMNIVORE',
      allergies: 'Peanuts',
      foodRestrictions: 'None',
      healthGoals: 'Stay healthy',
      sleepWakeTime: '07:00',
      sleepBedTime: '22:30',
      preferredUnits: 'METRIC',
      timezone: 'Asia/Calcutta',
    },
  });
  const profileB = await prisma.familyProfile.create({
    data: { userId: ownerB.id, name: 'Profile B', relationship: 'SELF' },
  });
  const invitedWrongEmail = await prisma.careCircleInvitation.create({
    data: {
      userId: ownerA.id,
      familyProfileId: profileA.id,
      email: `wrong-${suffix}@example.com`,
      relationshipLabel: 'Wrong email',
      role: 'viewer',
      permissions: JSON.stringify(defaultPermissions('viewer')),
      status: 'pending',
      token: `wrong-email-${suffix}`,
      expiresAt: new Date(Date.now() + 86400000),
    },
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
  const strangerMember = await prisma.careCircleMember.create({
    data: {
      userId: stranger.id,
      familyProfileId: profileB.id,
      email: stranger.email,
      relationshipLabel: 'Stranger',
      role: 'viewer',
      permissions: JSON.stringify(defaultPermissions('viewer')),
      active: true,
      acceptedAt: new Date(),
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

  const emergencyContact = await prisma.emergencyContact.create({
    data: {
      familyProfileId: profileA.id,
      name: 'Primary Contact',
      relationship: 'Spouse',
      phone: '+1-222-333-4444',
      alternatePhone: null,
      priority: 1,
      notes: 'Reach first',
      active: true,
    },
  });

  const invitation = await prisma.careCircleInvitation.create({
    data: {
      userId: ownerA.id,
      familyProfileId: profileA.id,
      email: invitee.email,
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
    invitee,
    stranger,
    profileA,
    profileB,
    caregiverMember,
    viewerMember,
    strangerMember,
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
    emergencyContact,
    invitation,
    invitedWrongEmail,
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
    prisma.user.deleteMany({ where: { id: { in: [fixture.ownerA.id, fixture.ownerB.id, fixture.caregiver.id, fixture.viewer.id, fixture.invitee.id, fixture.stranger.id] } } }),
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
  assert.equal(body.currentMedications, null);
  assert.equal(body.emergencyNote, null);
  assert.equal(body.id, undefined);
  assert.deepEqual(body.contacts, [
    {
      name: 'Primary Contact',
      relationship: 'Spouse',
      phone: '+1-222-333-4444',
      alternatePhone: null,
      priority: 1,
    },
  ]);

  const privacyProfile = await prisma.familyProfile.create({
    data: { userId: fixture.ownerA.id, name: 'Privacy Profile', relationship: 'SELF' },
  });
  const privateProfile = await prisma.emergencyProfile.create({
    data: {
      familyProfileId: privacyProfile.id,
      preferredName: 'Private Setup',
      bloodType: 'B+',
      publicFields: JSON.stringify(['preferredName']),
      token: `private-token-${Date.now()}`,
      active: true,
    },
  });
  await prisma.emergencyContact.create({
    data: {
      familyProfileId: privacyProfile.id,
      name: 'Private Contact',
      relationship: 'Sibling',
      phone: '+1-444-555-6666',
      alternatePhone: null,
      priority: 1,
      notes: 'Hidden note',
      active: true,
    },
  });
  const privateRes = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${privateProfile.token}`, {}, { token: privateProfile.token });
  assert.equal(privateRes.status, 200);
  const privateBody = await jsonResponse(privateRes);
  assert.deepEqual(privateBody.contacts, []);
  assert.equal(privateBody.id, undefined);

  const optInProfile = await prisma.emergencyProfile.update({
    where: { id: privateProfile.id },
    data: { publicFields: JSON.stringify(['preferredName', 'contacts']) },
  });
  const optInRes = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${optInProfile.token}`, {}, { token: optInProfile.token });
  assert.equal(optInRes.status, 200);
  const optInBody = await jsonResponse(optInRes);
  assert.equal(optInBody.contacts.length, 1);
  assert.equal(optInBody.contacts[0].name, 'Private Contact');
  assert.equal(optInBody.contacts[0].notes, undefined);
  assert.equal(optInBody.contacts[0].active, undefined);
  assert.equal(optInBody.contacts[0].id, undefined);

  const optOutProfile = await prisma.emergencyProfile.update({
    where: { id: privateProfile.id },
    data: { publicFields: JSON.stringify(['preferredName']) },
  });
  const optOutRes = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${optOutProfile.token}`, {}, { token: optOutProfile.token });
  assert.equal(optOutRes.status, 200);
  const optOutBody = await jsonResponse(optOutRes);
  assert.deepEqual(optOutBody.contacts, []);

  await prisma.emergencyProfile.update({
    where: { id: privateProfile.id },
    data: { publicFields: null },
  });
  const legacyMissingRes = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${privateProfile.token}`, {}, { token: privateProfile.token });
  assert.equal(legacyMissingRes.status, 200);
  const legacyMissingBody = await jsonResponse(legacyMissingRes);
  assert.deepEqual(legacyMissingBody.contacts, []);

  await prisma.emergencyProfile.update({
    where: { id: privateProfile.id },
    data: { publicFields: '{malformed' },
  });
  const malformedRes = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${privateProfile.token}`, {}, { token: privateProfile.token });
  assert.equal(malformedRes.status, 200);
  const malformedBody = await jsonResponse(malformedRes);
  assert.deepEqual(malformedBody.contacts, []);

  await prisma.$transaction([
    prisma.emergencyContact.deleteMany({ where: { familyProfileId: privacyProfile.id } }),
    prisma.emergencyProfile.delete({ where: { id: privateProfile.id } }),
    prisma.familyProfile.delete({ where: { id: privacyProfile.id } }),
  ]);

  const expired = await prisma.emergencyProfile.create({
    data: {
      familyProfileId: fixture.profileB.id,
      preferredName: 'Expired',
      publicFields: JSON.stringify(['preferredName']),
      token: `expired-emergency-${Date.now()}`,
      active: true,
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  const revoked = await prisma.emergencyProfile.update({
    where: { familyProfileId: fixture.profileA.id },
    data: { active: false, expiresAt: null },
  });
  const expiredRes = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${expired.token}`, {}, { token: expired.token });
  const revokedRes = await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${revoked.token}`, {}, { token: revoked.token });
  assert.equal(expiredRes.status, 404);
  assert.equal(revokedRes.status, 404);
});

test('authenticated emergency summary is scoped to the active profile and does not reuse stale contact data', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.ownerA.id, email: fixture.ownerA.email, name: fixture.ownerA.name });
  setSession(token, fixture.profileA.id);

  const resA = await callRoute('./../app/api/emergency/route', 'GET', 'http://localhost/api/emergency');
  assert.equal(resA.status, 200);
  const bodyA = await jsonResponse(resA);
  assert.equal(bodyA.preferredName, 'Visible Name');
  assert.equal(bodyA.bloodType, 'O+');
  assert.equal(bodyA.tokenStatus, 'active');
  assert.equal(bodyA.publicUrl, `http://localhost:3000/emergency/${fixture.emergencyProfile.token}`);
  assert.equal(bodyA.contacts.length, 1);
  assert.equal(bodyA.contacts[0].phone, '+1-222-333-4444');

  const profileB = await prisma.familyProfile.create({
    data: { userId: fixture.ownerA.id, name: 'Profile B2', relationship: 'SELF' },
  });
  await prisma.emergencyProfile.create({
    data: {
      familyProfileId: profileB.id,
      preferredName: 'Second Profile',
      bloodType: 'A-',
      allergies: 'Shellfish',
      criticalConditions: 'Diabetes',
      currentMedications: 'Insulin',
      emergencyNote: 'Second profile note',
      publicFields: JSON.stringify(['preferredName', 'bloodType', 'contacts']),
      token: `public-token-b-${Date.now()}`,
      active: true,
    },
  });
  await prisma.emergencyContact.create({
    data: {
      familyProfileId: profileB.id,
      name: 'Second Contact',
      relationship: 'Sibling',
      phone: '+1-999-888-7777',
      alternatePhone: null,
      priority: 1,
      notes: null,
      active: true,
    },
  });

  setSession(token, profileB.id);
  const resB = await callRoute('./../app/api/emergency/route', 'GET', 'http://localhost/api/emergency');
  assert.equal(resB.status, 200);
  const bodyB = await jsonResponse(resB);
  assert.equal(bodyB.preferredName, 'Second Profile');
  assert.equal(bodyB.bloodType, 'A-');
  assert.equal(bodyB.contacts.length, 1);
  assert.equal(bodyB.contacts[0].phone, '+1-999-888-7777');
  assert.notEqual(bodyB.publicUrl, bodyA.publicUrl);

  setSession(token, fixture.profileA.id);
  const revokedProfile = await prisma.emergencyProfile.update({
    where: { familyProfileId: fixture.profileA.id },
    data: { active: false },
  });
  const revokedRes = await callRoute('./../app/api/emergency/route', 'GET', 'http://localhost/api/emergency');
  assert.equal(revokedRes.status, 200);
  const revokedBody = await jsonResponse(revokedRes);
  assert.equal(revokedBody.tokenStatus, 'revoked');
  assert.equal(revokedBody.publicUrl, `http://localhost:3000/emergency/${revokedProfile.token}`);

  await prisma.$transaction([
    prisma.emergencyContact.deleteMany({ where: { familyProfileId: profileB.id } }),
    prisma.emergencyProfile.deleteMany({ where: { familyProfileId: profileB.id } }),
    prisma.familyProfile.delete({ where: { id: profileB.id } }),
  ]);
});

test('emergency summary follows the current active profile without stale cross-profile leakage', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.ownerA.id, email: fixture.ownerA.email, name: fixture.ownerA.name });
  setSession(token, fixture.profileA.id);

  const profileB = await prisma.familyProfile.create({
    data: { userId: fixture.ownerA.id, name: 'Profile B2', relationship: 'SELF' },
  });
  const profileC = await prisma.familyProfile.create({
    data: { userId: fixture.ownerA.id, name: 'Profile C', relationship: 'SELF' },
  });

  const emergencyA = await prisma.emergencyProfile.update({
    where: { familyProfileId: fixture.profileA.id },
    data: {
      preferredName: 'Alpha',
      bloodType: 'O-',
      allergies: 'Peanuts',
      criticalConditions: 'Asthma',
      currentMedications: 'Inhaler',
      publicFields: JSON.stringify(['preferredName', 'bloodType', 'contacts']),
      active: true,
    },
  });
  const emergencyB = await prisma.emergencyProfile.create({
    data: {
      familyProfileId: profileB.id,
      preferredName: 'Beta',
      bloodType: 'AB+',
      allergies: 'Shellfish',
      criticalConditions: 'Diabetes',
      currentMedications: 'Insulin',
      publicFields: JSON.stringify(['preferredName', 'bloodType', 'contacts']),
      token: `beta-token-${Date.now()}`,
      active: true,
    },
  });

  const contactA = await prisma.emergencyContact.update({
    where: { id: fixture.emergencyContact.id },
    data: {
      name: 'Alpha Contact',
      relationship: 'Spouse',
      phone: '+1-111-111-1111',
      alternatePhone: null,
      priority: 1,
      notes: null,
      active: true,
    },
  });
  const contactB = await prisma.emergencyContact.create({
    data: {
      familyProfileId: profileB.id,
      name: 'Beta Contact',
      relationship: 'Sibling',
      phone: '+1-222-222-2222',
      alternatePhone: null,
      priority: 1,
      notes: null,
      active: true,
    },
  });

  await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${emergencyA.token}`, {}, { token: emergencyA.token });

  const resA = await callRoute('./../app/api/emergency/route', 'GET', 'http://localhost/api/emergency');
  assert.equal(resA.status, 200);
  const bodyA = await jsonResponse(resA);
  assert.equal(bodyA.bloodType, 'O-');
  assert.equal(bodyA.allergies, 'Peanuts');
  assert.equal(bodyA.contacts.length, 1);
  assert.equal(bodyA.contacts[0].id, contactA.id);
  assert.equal(bodyA.contacts[0].phone, '+1-111-111-1111');
  assert.ok(bodyA.accessLogs.length >= 1);
  assert.ok(bodyA.accessLogs.some((entry: { tokenRef: string }) => entry.tokenRef === emergencyA.token.slice(0, 12)));
  assert.equal(bodyA.preferredName, 'Alpha');
  assert.equal(bodyA.publicUrl, `http://localhost:3000/emergency/${emergencyA.token}`);
  assert.ok(!JSON.stringify(bodyA).includes('Beta Contact'));

  const switchRes = await callRoute('./../app/api/family/active/route', 'POST', 'http://localhost/api/family/active', {
    method: 'POST',
    body: JSON.stringify({ profileId: profileB.id }),
  });
  assert.equal(switchRes.status, 200);

  await callRoute('./../app/api/emergency/public/[token]/route', 'GET', `http://localhost/api/emergency/public/${emergencyB.token}`, {}, { token: emergencyB.token });

  const resB = await callRoute('./../app/api/emergency/route', 'GET', 'http://localhost/api/emergency');
  assert.equal(resB.status, 200);
  const bodyB = await jsonResponse(resB);
  assert.equal(bodyB.bloodType, 'AB+');
  assert.equal(bodyB.allergies, 'Shellfish');
  assert.equal(bodyB.contacts.length, 1);
  assert.equal(bodyB.contacts[0].id, contactB.id);
  assert.equal(bodyB.contacts[0].phone, '+1-222-222-2222');
  assert.ok(bodyB.accessLogs.length >= 1);
  assert.ok(bodyB.accessLogs.some((entry: { tokenRef: string }) => entry.tokenRef === emergencyB.token.slice(0, 12)));
  assert.equal(bodyB.preferredName, 'Beta');
  assert.equal(bodyB.publicUrl, `http://localhost:3000/emergency/${emergencyB.token}`);
  assert.ok(!JSON.stringify(bodyB).includes('Alpha Contact'));

  const unauthorizedSwitch = await callRoute('./../app/api/family/active/route', 'POST', 'http://localhost/api/family/active', {
    method: 'POST',
    body: JSON.stringify({ profileId: fixture.profileB.id }),
  });
  assert.equal(unauthorizedSwitch.status, 404);

  setSession(token, profileC.id);
  const missingRes = await callRoute('./../app/api/emergency/route', 'GET', 'http://localhost/api/emergency');
  assert.equal(missingRes.status, 200);
  const missingBody = await jsonResponse(missingRes);
  assert.equal(missingBody, null);

  await prisma.$transaction([
    prisma.emergencyContact.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, profileB.id] } } }),
    prisma.emergencyProfile.deleteMany({ where: { familyProfileId: { in: [fixture.profileA.id, profileB.id] } } }),
    prisma.familyProfile.deleteMany({ where: { id: { in: [profileB.id, profileC.id] } } }),
  ]);
});

test('account profile endpoints update only the authenticated user and do not leak password hashes', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.ownerA.id, email: fixture.ownerA.email, name: fixture.ownerA.name });
  setSession(token, fixture.profileA.id);

  const meRes = await callRoute('./../app/api/auth/me/route', 'GET', 'http://localhost/api/auth/me');
  assert.equal(meRes.status, 200);
  const meBody = await jsonResponse(meRes);
  assert.equal(meBody.user.email, fixture.ownerA.email);
  assert.equal(meBody.user.password, undefined);

  const patchRes = await callRoute('./../app/api/auth/me/route', 'PATCH', 'http://localhost/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Updated Owner' }),
  });
  assert.equal(patchRes.status, 200);
  const patchBody = await jsonResponse(patchRes);
  assert.equal(patchBody.user.name, 'Updated Owner');

  const profileRes = await callRoute('./../app/api/profile/route', 'PATCH', 'http://localhost/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ dateOfBirth: '1990-01-01', height: 180, timezone: 'Asia/Calcutta' }),
  });
  assert.equal(profileRes.status, 200);
  const profileBody = await jsonResponse(profileRes);
  assert.equal(profileBody.dateOfBirth, '1990-01-01');
  assert.equal(profileBody.height, 180);
  assert.equal(profileBody.timezone, 'Asia/Calcutta');
});

test('password change rejects invalid current password and accepts the correct one', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const token = signToken({ userId: fixture.ownerA.id, email: fixture.ownerA.email, name: fixture.ownerA.name });
  setSession(token, fixture.profileA.id);

  const rejected = await callRoute('./../app/api/auth/password/route', 'POST', 'http://localhost/api/auth/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'newpass123', confirmPassword: 'newpass123' }),
  });
  assert.equal(rejected.status, 400);

  const accepted = await callRoute('./../app/api/auth/password/route', 'POST', 'http://localhost/api/auth/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword: 'pw', newPassword: 'newpass123', confirmPassword: 'newpass123' }),
  });
  assert.equal(accepted.status, 200);
});

test('care circle invitation abuse is denied safely', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const ownerToken = signToken({ userId: fixture.ownerA.id, email: fixture.ownerA.email, name: fixture.ownerA.name });
  const inviteeToken = signToken({ userId: fixture.invitee.id, email: fixture.invitee.email, name: fixture.invitee.name });
  setSession(ownerToken, fixture.profileA.id);

  const selfInvite = await callRoute('./../app/api/care-circle/route', 'POST', 'http://localhost/api/care-circle', {
    method: 'POST',
    body: JSON.stringify({ familyProfileId: fixture.profileA.id, email: fixture.ownerA.email, role: 'caregiver' }),
  });
  assert.equal(selfInvite.status, 400);

  const duplicateInvite = await callRoute('./../app/api/care-circle/route', 'POST', 'http://localhost/api/care-circle', {
    method: 'POST',
    body: JSON.stringify({ familyProfileId: fixture.profileA.id, email: fixture.invitation.email, role: 'caregiver' }),
  });
  assert.equal(duplicateInvite.status, 409);

  const caregiverToken = signToken({ userId: fixture.caregiver.id, email: fixture.caregiver.email, name: fixture.caregiver.name });
  setSession(caregiverToken, fixture.profileA.id);
  const caregiverInvite = await callRoute('./../app/api/care-circle/route', 'POST', 'http://localhost/api/care-circle', {
    method: 'POST',
    body: JSON.stringify({ familyProfileId: fixture.profileA.id, email: `new-${fixture.caregiver.email}`, role: 'caregiver' }),
  });
  assert.equal(caregiverInvite.status, 403);

  const viewerToken = signToken({ userId: fixture.viewer.id, email: fixture.viewer.email, name: fixture.viewer.name });
  setSession(viewerToken, fixture.profileA.id);
  const viewerInvite = await callRoute('./../app/api/care-circle/route', 'POST', 'http://localhost/api/care-circle', {
    method: 'POST',
    body: JSON.stringify({ familyProfileId: fixture.profileA.id, email: `new-${fixture.viewer.email}`, role: 'viewer' }),
  });
  assert.equal(viewerInvite.status, 403);

  const crossProfileInvite = await callRoute('./../app/api/care-circle/route', 'POST', 'http://localhost/api/care-circle', {
    method: 'POST',
    body: JSON.stringify({ familyProfileId: fixture.profileB.id, email: 'cross@example.com', role: 'viewer' }),
  });
  assert.equal(crossProfileInvite.status, 403);

  setSession(inviteeToken, fixture.profileA.id);
  const accepted = await callRoute('./../app/api/care-circle/invitations/[token]/route', 'POST', `http://localhost/api/care-circle/invitations/${fixture.invitation.token}`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'accept' }),
  }, { token: fixture.invitation.token });
  assert.equal(accepted.status, 201);

  const acceptedReuse = await callRoute('./../app/api/care-circle/invitations/[token]/route', 'POST', `http://localhost/api/care-circle/invitations/${fixture.invitation.token}`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'accept' }),
  }, { token: fixture.invitation.token });
  assert.equal(acceptedReuse.status, 410);

  const unrelatedToken = signToken({ userId: fixture.ownerB.id, email: fixture.ownerB.email, name: fixture.ownerB.name });
  setSession(unrelatedToken, fixture.profileB.id);
  const wrongEmailAccept = await callRoute('./../app/api/care-circle/invitations/[token]/route', 'POST', `http://localhost/api/care-circle/invitations/${fixture.invitedWrongEmail.token}`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'accept' }),
  }, { token: fixture.invitedWrongEmail.token });
  assert.equal(wrongEmailAccept.status, 403);

  const malformedToken = await callRoute('./../app/api/care-circle/invitations/[token]/route', 'POST', 'http://localhost/api/care-circle/invitations/not-a-token', {
    method: 'POST',
    body: JSON.stringify({ decision: 'accept' }),
  }, { token: 'not-a-token' });
  assert.equal(malformedToken.status, 404);

  const nonexistentToken = await callRoute('./../app/api/care-circle/invitations/[token]/route', 'POST', 'http://localhost/api/care-circle/invitations/does-not-exist', {
    method: 'POST',
    body: JSON.stringify({ decision: 'accept' }),
  }, { token: 'does-not-exist' });
  assert.equal(nonexistentToken.status, 404);

  const expired = await prisma.careCircleInvitation.create({
    data: {
      userId: fixture.ownerA.id,
      familyProfileId: fixture.profileA.id,
      email: `expired-${fixture.ownerA.email}`,
      relationshipLabel: 'Expired',
      role: 'viewer',
      permissions: JSON.stringify(defaultPermissions('viewer')),
      status: 'pending',
      token: `expired-${Date.now()}`,
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  const expiredReuse = await callRoute('./../app/api/care-circle/invitations/[token]/route', 'POST', `http://localhost/api/care-circle/invitations/${expired.token}`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'accept' }),
  }, { token: expired.token });
  assert.equal(expiredReuse.status, 410);

  const revoked = await prisma.careCircleInvitation.create({
    data: {
      userId: fixture.ownerA.id,
      familyProfileId: fixture.profileA.id,
      email: `revoked-${fixture.ownerA.email}`,
      relationshipLabel: 'Revoked',
      role: 'viewer',
      permissions: JSON.stringify(defaultPermissions('viewer')),
      status: 'revoked',
      token: `revoked-${Date.now()}`,
      revokedAt: new Date(),
    },
  });
  const revokedReuse = await callRoute('./../app/api/care-circle/invitations/[token]/route', 'POST', `http://localhost/api/care-circle/invitations/${revoked.token}`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'accept' }),
  }, { token: revoked.token });
  assert.equal(revokedReuse.status, 410);
});

test('care circle member escalation and cross-profile manipulation are denied', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const caregiverToken = signToken({ userId: fixture.caregiver.id, email: fixture.caregiver.email, name: fixture.caregiver.name });
  setSession(caregiverToken, fixture.profileA.id);

  const selfRoleEdit = await callRoute('./../app/api/care-circle/members/[id]/route', 'PATCH', `http://localhost/api/care-circle/members/${fixture.caregiverMember.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: 'owner' }),
  }, { id: fixture.caregiverMember.id });
  assert.equal(selfRoleEdit.status, 403);

  const selfDelete = await callRoute('./../app/api/care-circle/members/[id]/route', 'DELETE', `http://localhost/api/care-circle/members/${fixture.caregiverMember.id}`, {
    method: 'DELETE',
  }, { id: fixture.caregiverMember.id });
  assert.equal(selfDelete.status, 200);

  const revokeOwner = await callRoute('./../app/api/care-circle/members/[id]/route', 'DELETE', `http://localhost/api/care-circle/members/${fixture.viewerMember.id}`, {
    method: 'DELETE',
  }, { id: fixture.viewerMember.id });
  assert.equal(revokeOwner.status, 404);

  const crossProfileMemberUpdate = await callRoute('./../app/api/care-circle/members/[id]/route', 'PATCH', `http://localhost/api/care-circle/members/${fixture.strangerMember.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ relationshipLabel: 'Edited' }),
  }, { id: fixture.strangerMember.id });
  assert.equal(crossProfileMemberUpdate.status, 404);

  const viewerToken = signToken({ userId: fixture.viewer.id, email: fixture.viewer.email, name: fixture.viewer.name });
  setSession(viewerToken, fixture.profileA.id);
  const viewerUpdate = await callRoute('./../app/api/care-circle/members/[id]/route', 'PATCH', `http://localhost/api/care-circle/members/${fixture.viewerMember.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions: { records: true } }),
  }, { id: fixture.viewerMember.id });
  assert.equal(viewerUpdate.status, 403);

  const unrelatedAppointment = await callRoute('./../app/api/appointments/[id]/route', 'PATCH', `http://localhost/api/appointments/${fixture.appointmentB.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'CONFIRMED' }),
  }, { id: fixture.appointmentB.id });
  assert.equal(unrelatedAppointment.status, 403);
});

test('handoff creation, acknowledgement, and audit visibility are restricted', async (t) => {
  const fixture = await createFixture();
  t.after(() => cleanupFixture(fixture));

  const caregiverToken = signToken({ userId: fixture.caregiver.id, email: fixture.caregiver.email, name: fixture.caregiver.name });
  setSession(caregiverToken, fixture.profileA.id);

  const createDenied = await callRoute('./../app/api/care-circle/handoffs/route', 'POST', 'http://localhost/api/care-circle/handoffs', {
    method: 'POST',
    body: JSON.stringify({
      familyProfileId: fixture.profileB.id,
      outgoingCaregiverId: fixture.caregiver.id,
      handoffDateTime: '2026-07-14T10:00:00Z',
      summary: 'handoff',
    }),
  });
  assert.equal(createDenied.status, 404);

  const ownHandoff = await callRoute('./../app/api/care-circle/handoffs/route', 'POST', 'http://localhost/api/care-circle/handoffs', {
    method: 'POST',
    body: JSON.stringify({
      outgoingCaregiverId: fixture.caregiver.id,
      handoffDateTime: '2026-07-14T10:00:00Z',
      summary: 'Shift notes',
      completedTasks: 'Completed checklist',
      pendingTasks: 'Monitor sleep',
      medicationNotes: 'Observed routine only',
      appointmentNotes: 'Observed upcoming visit',
      generalNotes: 'No diagnosis',
    }),
  });
  assert.equal(ownHandoff.status, 201);
  const created = await ownHandoff.json();

  const duplicateAck = await callRoute('./../app/api/care-circle/handoffs/[id]/route', 'PATCH', `http://localhost/api/care-circle/handoffs/${created.id}`, { method: 'PATCH' }, { id: created.id });
  assert.equal(duplicateAck.status, 200);
  const duplicateAckAgain = await callRoute('./../app/api/care-circle/handoffs/[id]/route', 'PATCH', `http://localhost/api/care-circle/handoffs/${created.id}`, { method: 'PATCH' }, { id: created.id });
  assert.equal(duplicateAckAgain.status, 200);

  const ownerToken = signToken({ userId: fixture.ownerA.id, email: fixture.ownerA.email, name: fixture.ownerA.name });
  setSession(ownerToken, fixture.profileA.id);
  const auditUser = await callRoute('./../app/api/audit/route', 'GET', 'http://localhost/api/audit');
  assert.equal(auditUser.status, 200);
  const auditBody = await auditUser.json();
  assert.ok(Array.isArray(auditBody.logs));

  const viewerToken = signToken({ userId: fixture.viewer.id, email: fixture.viewer.email, name: fixture.viewer.name });
  setSession(viewerToken, fixture.profileA.id);
  const auditDenied = await callRoute('./../app/api/audit/route', 'GET', 'http://localhost/api/audit');
  assert.equal(auditDenied.status, 403);
});

