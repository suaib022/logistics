import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { buildTranscript } = require('../logic/transcript.js');

function loadFixture(name) {
  const filePath = path.join(__dirname, 'fixtures', name);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('Transcript: normal conversation formats Customer and Agent lines, skips nulls, sets has_user_message', () => {
  const fixture = loadFixture('transcript-normal.json');
  const res = buildTranscript(fixture, { attempt: 1, maxAttempts: 3, maxChars: 20000 });

  assert.equal(res.should_retry, false);
  assert.equal(res.has_user_message, true);
  assert.equal(res.note_kind, 'transcript');
  assert.match(res.transcript_text, /^Agent: Thank you for contacting Ciketo Logistics/);
  assert.match(res.transcript_text, /Customer: Hi, my cargo arrived/);
  assert.match(res.transcript_text, /Customer: Please make sure they follow up by email\.$/);
  // Null message was skipped
  assert.doesNotMatch(res.transcript_text, /null/);
});

test('Transcript: truncates text exceeding maxChars and appends [truncated] marker', () => {
  const fixture = loadFixture('transcript-truncation.json');
  const maxChars = 80;
  const res = buildTranscript(fixture, { attempt: 1, maxAttempts: 3, maxChars });

  assert.equal(res.should_retry, false);
  assert.ok(res.transcript_text.length <= maxChars);
  assert.ok(res.transcript_text.endsWith('[truncated]'));
});

test('Transcript: empty transcript on attempt 1 signals retry', () => {
  const fixture = loadFixture('transcript-empty.json');
  const res = buildTranscript(fixture, { attempt: 1, maxAttempts: 3, maxChars: 20000 });

  assert.equal(res.should_retry, true);
  assert.equal(res.attempt, 2);
  assert.equal(res.has_user_message, false);
});

test('Transcript: empty transcript on final attempt (attempt >= maxAttempts) falls back to system note', () => {
  const fixture = loadFixture('transcript-empty.json');
  const res = buildTranscript(fixture, { attempt: 3, maxAttempts: 3, maxChars: 20000 });

  assert.equal(res.should_retry, false);
  assert.equal(res.transcript_text, 'Transcript could not be retrieved.');
  assert.equal(res.note_kind, 'system');
  assert.equal(res.has_user_message, false);
});

test('Transcript: fetch failure / error status on final attempt falls back to system note', () => {
  const failedData = { statusCode: 500, error: 'Server unavailable' };
  const res = buildTranscript(failedData, { attempt: 3, maxAttempts: 3, maxChars: 20000 });

  assert.equal(res.should_retry, false);
  assert.equal(res.transcript_text, 'Transcript could not be retrieved.');
  assert.equal(res.note_kind, 'system');
});
