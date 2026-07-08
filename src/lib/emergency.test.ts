import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import { getEmergencyTokenStatus, getPublicEmergencyUrl } from './emergency';

test('public emergency url is the only QR payload source', async () => {
  const url = getPublicEmergencyUrl('token-123');
  assert.equal(url, 'http://localhost:3000/emergency/token-123');

  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  assert.equal(qr.data, url);
  assert.ok(!String(qr.data).includes('blood'));
  assert.ok(!String(qr.data).includes('id'));
});

test('emergency token status reflects active, expired, and revoked states', () => {
  assert.equal(getEmergencyTokenStatus({ active: true, expiresAt: null }), 'active');
  assert.equal(getEmergencyTokenStatus({ active: false, expiresAt: null }), 'revoked');
  assert.equal(getEmergencyTokenStatus({ active: true, expiresAt: new Date('2000-01-01T00:00:00Z') }), 'expired');
});
