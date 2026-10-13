import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { verifyIdentity } = require('../logic/verify.js');

function loadFixture(name) {
  const filePath = path.join(__dirname, 'fixtures', name);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('Verify: identity verified when ticket email matches order email', () => {
  const fixture = loadFixture('order-matched-email.json');
  const res = verifyIdentity(fixture.ticket, fixture.orders);

  assert.equal(res.order_uuid, 'e0000005-ebcd-4354-ab66-c94d2f958742');
  assert.equal(res.identity_verified, true);
  assert.equal(res.is_handoff, true);
  assert.equal(res.source, 'chat_agent');
});

test('Verify: identity verified when last 7 digits of phone match order phone', () => {
  const fixture = loadFixture('order-matched-phone.json');
  const res = verifyIdentity(fixture.ticket, fixture.orders);

  assert.equal(res.order_uuid, 'e0000005-ebcd-4354-ab66-c94d2f958742');
  assert.equal(res.identity_verified, true);
});

test('Verify: identity not verified when neither email nor phone match', () => {
  const fixture = loadFixture('order-unverified.json');
  const res = verifyIdentity(fixture.ticket, fixture.orders);

  assert.equal(res.order_uuid, 'e0000005-ebcd-4354-ab66-c94d2f958742');
  assert.equal(res.identity_verified, false);
});

test('Verify: order_uuid is null and identity unverified when no orders match', () => {
  const ticket = {
    customer_name: 'No Order',
    email: 'noorder@example.com',
    phone: '+15551234567',
    order_id: 'CKT-2026-999999'
  };
  const res = verifyIdentity(ticket, []);

  assert.equal(res.order_uuid, null);
  assert.equal(res.identity_verified, false);
});

test('Verify: order_uuid is null when multiple orders match (ambiguous)', () => {
  const ticket = {
    customer_name: 'Ambiguous',
    email: 'ambig@example.com',
    phone: '+15551234567',
    order_id: 'CKT-2026-100012'
  };
  const orders = [
    { id: 'uuid-1', order_id: 'CKT-2026-100012', email: 'ambig@example.com' },
    { id: 'uuid-2', order_id: 'CKT-2026-100012', email: 'ambig@example.com' }
  ];
  const res = verifyIdentity(ticket, orders);

  assert.equal(res.order_uuid, null);
  assert.equal(res.identity_verified, false);
});
