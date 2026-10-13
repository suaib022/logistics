/**
 * Pure function: Validate and Normalize Support Ticket Request
 * Ciketo Logistics ElevenLabs Support Ticket Handoff
 */

function simpleHash(str) {
  let hash = 5381;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const VALID_CATEGORIES = new Set([
  'unanswered_question',
  'complaint',
  'delay',
  'damage_claim',
  'billing',
  'quote_followup',
  'callback_request',
  'customs_legal',
  'other'
]);

const VALID_PRIORITIES = new Set([
  'low',
  'normal',
  'high',
  'urgent'
]);

const URGENT_REGEX = /\b(urgent|asap|emergency|lost|stolen)\b/i;

function normalizeTicketRequest(body, config = {}) {
  // Reject bodies with wrong types or exceeding expected size
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      valid: false,
      validation_message: 'Request body must be a valid JSON object.'
    };
  }

  let bodyStr = '';
  try {
    bodyStr = JSON.stringify(body);
  } catch (e) {
    return {
      valid: false,
      validation_message: 'Request body contains invalid or unparseable JSON.'
    };
  }

  if (bodyStr.length > 50000) {
    return {
      valid: false,
      validation_message: 'Request body exceeds maximum allowed size.'
    };
  }

  // Trim and extract raw values
  function cleanStr(val) {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  }

  const rawConvId = cleanStr(body.conversation_id);
  const rawName = cleanStr(body.customer_name);
  const rawEmail = cleanStr(body.email);
  const rawPhone = cleanStr(body.phone);
  const rawOrderId = cleanStr(body.order_id);
  const rawCategory = cleanStr(body.category).toLowerCase();
  const rawPriority = cleanStr(body.priority).toLowerCase();
  const rawSummary = cleanStr(body.summary);
  const rawDetails = cleanStr(body.details);

  // 1. Validate conversation_id (required, string starting with "conv_")
  if (!rawConvId || !rawConvId.startsWith('conv_') || rawConvId.length < 6) {
    return {
      valid: false,
      validation_message: 'A valid conversation ID starting with conv_ is required.'
    };
  }

  // 2. Validate customer_name (required)
  if (!rawName) {
    return {
      valid: false,
      validation_message: 'Customer name is required.'
    };
  }

  // 3. Normalize email
  let email = null;
  if (rawEmail) {
    const cleanedEmail = rawEmail.toLowerCase();
    if (cleanedEmail.includes('@') && cleanedEmail.includes('.')) {
      email = cleanedEmail;
    }
  }

  // 4. Normalize phone (keeps digits and a leading +)
  let phone = null;
  if (rawPhone) {
    const hasLeadingPlus = rawPhone.startsWith('+');
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length > 0) {
      phone = (hasLeadingPlus ? '+' : '') + digits;
    }
  }

  // 5. Email or Phone rule (at least one is required)
  if (!email && !phone) {
    return {
      valid: false,
      validation_message: 'At least one valid contact method (email or phone) is required.'
    };
  }

  // 6. Summary validation (required, 3 to 200 chars)
  if (!rawSummary || rawSummary.length < 3) {
    return {
      valid: false,
      validation_message: 'Summary must be at least 3 characters long.'
    };
  }
  const summary = rawSummary.slice(0, 200);

  // 7. Details validation (required, at least 5 chars, truncate to 4000)
  if (!rawDetails || rawDetails.length < 5) {
    return {
      valid: false,
      validation_message: 'Details must be at least 5 characters long.'
    };
  }
  const details = rawDetails.slice(0, 4000);

  // 8. Order ID normalization (upper-cases and trims)
  const orderId = rawOrderId ? rawOrderId.toUpperCase() : null;

  // 9. Coerce unknown category to "other"
  let category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'other';

  // 10. Coerce unknown priority to "normal"
  let priority = VALID_PRIORITIES.has(rawPriority) ? rawPriority : 'normal';

  // 11. Priority elevation rules:
  // - Raises priority to at least "high" when category is damage_claim or delay
  if (category === 'damage_claim' || category === 'delay') {
    if (priority === 'low' || priority === 'normal') {
      priority = 'high';
    }
  }

  // - Raises priority to "high" when details contain urgent words (urgent, asap, emergency, lost, stolen)
  if (URGENT_REGEX.test(details)) {
    if (priority === 'low' || priority === 'normal') {
      priority = 'high';
    }
  }

  // 12. Build dedupe_key from conversation_id, category and simple string hash of lower-cased summary
  const summaryHash = simpleHash(summary.toLowerCase());
  const dedupeKey = `${rawConvId}:${category}:${summaryHash}`;

  return {
    valid: true,
    validation_message: 'Validation passed.',
    conversation_id: rawConvId,
    customer_name: rawName,
    email: email,
    phone: phone,
    order_id: orderId,
    category: category,
    priority: priority,
    summary: summary,
    details: details,
    dedupe_key: dedupeKey,
    // Configuration values passed down
    SUPABASE_URL: config.SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co',
    TRANSCRIPT_MAX_CHARS: config.TRANSCRIPT_MAX_CHARS || 20000,
    FETCH_ATTEMPTS: config.FETCH_ATTEMPTS || 3
  };
}

// Module export for Node.js unit tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simpleHash,
    normalizeTicketRequest
  };
}

// n8n Code node runtime execution
if (typeof $input !== 'undefined') {
  const item = $input.first().json || {};
  const rawBody = item.body || item;
  let config = {};
  try {
    config = $('Config').first().json || {};
  } catch (e) {
    config = {};
  }
  const result = normalizeTicketRequest(rawBody, config);
  return [{ json: result }];
}
