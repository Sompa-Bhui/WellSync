import test from 'node:test';
import assert from 'node:assert/strict';
import { areContactsPublic, getEmergencyCardStatus, getEmergencyTokenStatus, getPublicEmergencyUrl, parsePublicFields } from './emergency';

test('public emergency url is the only QR payload source', async () => {
  const previousUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  try {
    const url = getPublicEmergencyUrl('token-123');
    assert.equal(url, 'http://localhost:3000/emergency/token-123');
    assert.ok(!url.includes('blood'));
    assert.ok(!url.includes('id'));
  } finally {
    process.env.NEXT_PUBLIC_APP_URL = previousUrl;
  }
});

test('emergency token status reflects active, expired, and revoked states', () => {
  assert.equal(getEmergencyTokenStatus({ active: true, expiresAt: null }), 'active');
  assert.equal(getEmergencyTokenStatus({ active: false, expiresAt: null }), 'revoked');
  assert.equal(getEmergencyTokenStatus({ active: true, expiresAt: new Date('2000-01-01T00:00:00Z') }), 'expired');
});

test('emergency card status uses setup required when no emergency profile exists', () => {
  assert.equal(getEmergencyCardStatus(null), 'setup-required');
  assert.equal(getEmergencyCardStatus({ active: true, expiresAt: null }), 'active');
  assert.equal(getEmergencyCardStatus({ active: false, expiresAt: null }), 'revoked');
});

test('public fields parsing fails closed for missing or malformed values', () => {
  assert.deepEqual(parsePublicFields(undefined), []);
  assert.deepEqual(parsePublicFields(null), []);
  assert.deepEqual(parsePublicFields(''), []);
  assert.deepEqual(parsePublicFields('{"contacts":true}'), []);
  assert.deepEqual(parsePublicFields(JSON.stringify(['preferredName', 'contacts'])), ['preferredName', 'contacts']);
  assert.equal(areContactsPublic(undefined), false);
  assert.equal(areContactsPublic('["preferredName"]'), false);
  assert.equal(areContactsPublic(JSON.stringify(['contacts'])), true);
});
