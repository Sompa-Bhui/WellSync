import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPermissions, hasPermission } from './permissions';

test('manager gets all permissions by default', () => {
  const perms = defaultPermissions('manager');
  assert.equal(perms['sleep.view'], true);
  assert.equal(perms['medications.manage_events'], true);
  assert.equal(perms['appointments.manage'], true);
  assert.equal(perms['records.add'], true);
});

test('caregiver view does not imply write-only permissions', () => {
  const perms = defaultPermissions('caregiver');
  assert.equal(perms['sleep.view'], true);
  assert.equal(perms['appointments.manage'], undefined);
  assert.equal(perms['records.add'], true);
  assert.equal(hasPermission(JSON.stringify(perms), 'appointments.manage'), false);
});

