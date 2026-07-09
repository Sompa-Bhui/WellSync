import { prisma } from '@/src/lib/db';
import { areContactsPublic, parsePublicFields } from '@/src/lib/emergency';

export default async function EmergencyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const profile = await prisma.emergencyProfile.findUnique({
    where: { token },
    include: { contacts: { where: { active: true }, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] } },
  });

  if (!profile || !profile.active || (profile.expiresAt && profile.expiresAt < new Date())) {
    return <div className="p-6">Emergency profile unavailable.</div>;
  }

  const enabled = new Set(parsePublicFields(profile.publicFields));
  const includeContacts = areContactsPublic(profile.publicFields);
  const data = {
    preferredName: enabled.has('preferredName') ? profile.preferredName : null,
    dateOfBirth: enabled.has('dateOfBirth') ? profile.dateOfBirth : null,
    bloodType: enabled.has('bloodType') ? profile.bloodType : null,
    allergies: enabled.has('allergies') ? profile.allergies : null,
    criticalConditions: enabled.has('criticalConditions') ? profile.criticalConditions : null,
    currentMedications: enabled.has('currentMedications') ? profile.currentMedications : null,
    primaryDoctor: enabled.has('primaryDoctor') ? profile.primaryDoctor : null,
    insuranceNote: enabled.has('insuranceNote') ? profile.insuranceNote : null,
    emergencyNote: enabled.has('emergencyNote') ? profile.emergencyNote : null,
    contacts: includeContacts ? profile.contacts.map((contact) => ({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      alternatePhone: contact.alternatePhone,
      priority: contact.priority,
    })) : [],
  };

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Emergency Information</h1>
        <p className="text-sm text-muted-foreground">Only fields explicitly enabled by the profile owner are shown here.</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </main>
  );
}
