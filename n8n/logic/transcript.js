/**
 * Pure function: Build Transcript from ElevenLabs Conversation
 * Ciketo Logistics ElevenLabs Support Ticket Handoff
 */

function buildTranscript(conversationData, options = {}) {
  const attempt = Number(options.attempt) || 1;
  const maxAttempts = Number(options.maxAttempts) || 3;
  const maxChars = Number(options.maxChars) || 20000;

  const data = conversationData || {};
  const hasError = Boolean(
    data.error ||
    (data.statusCode && data.statusCode >= 400) ||
    (data.status && data.status >= 400)
  );

  let rawTranscript = null;
  if (!hasError && Array.isArray(data.transcript)) {
    rawTranscript = data.transcript;
  } else if (!hasError && data.body && Array.isArray(data.body.transcript)) {
    rawTranscript = data.body.transcript;
  }

  // Handle fetch failure or missing transcript array
  if (hasError || rawTranscript === null) {
    if (attempt < maxAttempts) {
      return {
        should_retry: true,
        attempt: attempt + 1,
        transcript_text: '',
        note_kind: 'system',
        has_user_message: false
      };
    }
    return {
      should_retry: false,
      attempt: attempt,
      transcript_text: 'Transcript could not be retrieved.',
      note_kind: 'system',
      has_user_message: false
    };
  }

  // Process transcript entries
  const lines = [];
  let hasUserMessage = false;

  for (const entry of rawTranscript) {
    if (!entry || entry.message === null || entry.message === undefined) {
      continue;
    }

    const msg = String(entry.message).trim();
    if (!msg) {
      continue;
    }

    const role = String(entry.role || '').toLowerCase();
    if (role === 'user') {
      hasUserMessage = true;
      lines.push('Customer: ' + msg);
    } else if (role === 'agent') {
      lines.push('Agent: ' + msg);
    } else {
      lines.push('System: ' + msg);
    }
  }

  // If transcript was empty or only contained null/empty messages
  if (lines.length === 0) {
    if (attempt < maxAttempts) {
      return {
        should_retry: true,
        attempt: attempt + 1,
        transcript_text: '',
        note_kind: 'system',
        has_user_message: false
      };
    }
    return {
      should_retry: false,
      attempt: attempt,
      transcript_text: 'Transcript could not be retrieved.',
      note_kind: 'system',
      has_user_message: false
    };
  }

  let text = lines.join('\n');

  // Truncate to maxChars with [truncated] marker if exceeded
  if (text.length > maxChars) {
    const marker = '\n[truncated]';
    const sliceLen = Math.max(0, maxChars - marker.length);
    text = text.slice(0, sliceLen) + marker;
  }

  return {
    should_retry: false,
    attempt: attempt,
    transcript_text: text,
    note_kind: 'transcript',
    has_user_message: hasUserMessage
  };
}

// Module export for Node.js unit tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildTranscript
  };
}

// n8n Code node runtime execution
if (typeof $input !== 'undefined') {
  const convData = $input.first().json || {};
  let cfg = {};
  try {
    cfg = $('Config').first().json || {};
  } catch (e) {
    cfg = {};
  }

  let attempt = 1;
  try {
    const prevAttempt = $('Init Attempt').first().json.attempt;
    if (prevAttempt) attempt = Number(prevAttempt);
  } catch (e) {
    attempt = 1;
  }

  // Check if we are in a retry loop and attempt was already updated
  try {
    const lastAttempt = $('Build Transcript').first().json.attempt;
    if (lastAttempt && Number(lastAttempt) > attempt) {
      attempt = Number(lastAttempt);
    }
  } catch (e) {
    // first run
  }

  const maxChars = cfg.TRANSCRIPT_MAX_CHARS || 20000;
  const maxAttempts = cfg.FETCH_ATTEMPTS || 3;

  const result = buildTranscript(convData, { attempt, maxAttempts, maxChars });
  return [{ json: result }];
}
