export const CARE_CIRCLE_PERMISSIONS = [
  'dashboard.summary.view',
  'nutrition.view',
  'hydration.view',
  'sleep.view',
  'weight.view',
  'activity.view',
  'medications.view',
  'medications.manage_events',
  'appointments.view',
  'appointments.manage',
  'followups.view',
  'followups.manage',
  'records.view',
  'records.add',
  'timeline.view',
] as const;

export type CareCirclePermission = (typeof CARE_CIRCLE_PERMISSIONS)[number];

export function defaultPermissions(role: string) {
  if (role === 'manager') return CARE_CIRCLE_PERMISSIONS.reduce((acc, permission) => ({ ...acc, [permission]: true }), {} as Record<string, boolean>);
  if (role === 'caregiver') return {
    'dashboard.summary.view': true,
    'nutrition.view': true,
    'hydration.view': true,
    'sleep.view': true,
    'weight.view': true,
    'activity.view': true,
    'medications.view': true,
    'medications.manage_events': true,
    'appointments.view': true,
    'followups.view': true,
    'timeline.view': true,
    'records.view': true,
    'records.add': true,
  };
  return {
    'dashboard.summary.view': true,
    'nutrition.view': true,
    'hydration.view': true,
    'sleep.view': true,
    'weight.view': true,
    'activity.view': true,
    'medications.view': true,
    'appointments.view': true,
    'followups.view': true,
    'timeline.view': true,
    'records.view': true,
  };
}

export function hasPermission(perms: string | null | undefined, permission: CareCirclePermission) {
  if (!perms) return false;
  try {
    const parsed = JSON.parse(perms) as Record<string, boolean>;
    return Boolean(parsed[permission]);
  } catch {
    return false;
  }
}
