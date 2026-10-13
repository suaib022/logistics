import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { normalizeTicketRequest, simpleHash } = require('../logic/normalize.js');

function loadFixture(name) {
  const filePath = path.join(__dirname, 'fixtures', name);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('Normalize: valid request succeeds with expected fields', () => {
  const fixture = loadFixture('valid-request.json');
  const res = normalizeTicketRequest(fixture);

  assert.equal(res.valid, true);
  assert.equal(res.customer_name, 'Jordan Reed');
  assert.equal(res.email, 'jordan@industrialcore.de');
  assert.equal(res.phone, '+491705550123');
  assert.equal(res.order_id, 'CKT-2026-100015');
  assert.equal(res.category, 'damage_claim');
  // damage_claim raises priority to high
  assert.equal(res.priority, 'high');
  assert.ok(res.dedupe_key.startsWith('conv_3501m4qzyw53ek9azb78a357cwfp:damage_claim:'));
});

test('Normalize: rejects request with missing contact (neither email nor phone)', () => {
  const fixture = loadFixture('missing-contact.json');
  const res = normalizeTicketRequest(fixture);

  assert.equal(res.valid, false);
  assert.match(res.validation_message, /contact method/i);
});

test('Normalize: rejects conversation_id not starting with conv_', () => {
  const fixture = loadFixture('bad-conversation-id.json');
  const res = normalizeTicketRequest(fixture);

  assert.equal(res.valid, false);
  assert.match(res.validation_message, /conversation ID/i);
});

test('Normalize: coerces unknown category to other and unknown priority to normal', () => {
  const fixture = loadFixture('unknown-category.json');
  const res = normalizeTicketRequest(fixture);

  assert.equal(res.valid, true);
  assert.equal(res.category, 'other');
  assert.equal(res.priority, 'normal');
});

test('Normalize: urgent words in details elevate priority to high', () => {
  const fixture = loadFixture('urgent-words.json');
  const res = normalizeTicketRequest(fixture);

  assert.equal(res.valid, true);
  assert.equal(res.priority, 'high');
});

test('Normalize: damage_claim category elevates priority to high', () => {
  const fixture = loadFixture('damage-claim.json');
  const res = normalizeTicketRequest(fixture);

  assert.equal(res.valid, true);
  assert.equal(res.priority, 'high');
});

test('Normalize: delay category elevates priority to high', () => {
  const fixture = loadFixture('delay-category.json');
  const res = normalizeTicketRequest(fixture);

  assert.equal(res.valid, true);
  assert.equal(res.priority, 'high');
});

test('Normalize: simpleHash is stable for identical input and differs for different input', () => {
  const h1 = simpleHash('cargo damage report');
  const h2 = simpleHash('cargo damage report');
  const h3 = simpleHash('delayed container');

  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
  assert.match(h1, /^[0-9a-f]{8}$/);
});

test('Normalize: phone and email normalization behavior', () => {
  const res = normalizeTicketRequest({
    conversation_id: 'conv_test_phone_normalize',
    customer_name: 'Test Customer',
    email: '  USER.Name+tag@DOMAIN.COM  ',
    phone: ' +1 (555) 234-5678 ',
    summary: 'Testing normalization',
    details: 'Details for normal phone format check.'
  });

  assert.equal(res.valid, true);
  assert.equal(res.email, 'user.name+tag@domain.com');
  assert.equal(res.phone, '+15552345678');
});

test('Normalize: rejects body that is not a JSON object or too large', () => {
  assert.equal(normalizeTicketRequest(null).valid, false);
  assert.equal(normalizeTicketRequest('invalid string').valid, false);
  assert.equal(normalizeTicketRequest([]).valid, false);

  const hugeBody = {
    conversation_id: 'conv_huge',
    customer_name: 'Huge',
    email: 'huge@example.com',
    summary: 'Huge body',
    details: 'x'.repeat(60000)
  };
  assert.equal(normalizeTicketRequest(hugeBody).valid, false);
});
