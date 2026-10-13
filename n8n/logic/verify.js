/**
 * Pure function: Verify Identity Against Order Lookup
 * Ciketo Logistics ElevenLabs Support Ticket Handoff
 */

function verifyIdentity(ticket, orderLookupResult) {
  const t = ticket || {};
  let orders = [];

  if (Array.isArray(orderLookupResult)) {
    orders = orderLookupResult;
  } else if (orderLookupResult && typeof orderLookupResult === 'object') {
    if (Array.isArray(orderLookupResult.body)) {
      orders = orderLookupResult.body;
    } else if (orderLookupResult.id || orderLookupResult.order_id) {
      orders = [orderLookupResult];
    }
  }

  let orderUuid = null;
  let identityVerified = false;

  // order_uuid if exactly one order matched
  if (orders.length === 1 && orders[0] && (orders[0].id || orders[0].order_id)) {
    const matchedOrder = orders[0];
    orderUuid = matchedOrder.id || null;

    // identity_verified true only when the order matched and:
    // 1. ticket email equals the order email (case-insensitive)
    const ticketEmail = (t.email || '').toLowerCase().trim();
    const orderEmail = (matchedOrder.email || '').toLowerCase().trim();
    const emailMatches = Boolean(ticketEmail && orderEmail && ticketEmail === orderEmail);

    // 2. OR the last 7 digits of the phones match
    const ticketDigits = (t.phone || '').replace(/\D/g, '');
    const orderDigits = (matchedOrder.phone || '').replace(/\D/g, '');
    const phoneMatches = Boolean(
      ticketDigits.length >= 7 &&
      orderDigits.length >= 7 &&
      ticketDigits.slice(-7) === orderDigits.slice(-7)
    );

    identityVerified = emailMatches || phoneMatches;
  }

  return {
    customer_name: t.customer_name || '',
    email: t.email || null,
    phone: t.phone || null,
    order_id: t.order_id || null,
    order_uuid: orderUuid,
    category: t.category || 'other',
    priority: t.priority || 'normal',
    summary: t.summary || '',
    details: t.details || '',
    source: 'chat_agent',
    is_handoff: true,
    identity_verified: identityVerified,
    conversation_id: t.conversation_id || '',
    dedupe_key: t.dedupe_key || ''
  };
}

// Module export for Node.js unit tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    verifyIdentity
  };
}

// n8n Code node runtime execution
if (typeof $input !== 'undefined') {
  let ticket = {};
  try {
    ticket = $('Validate and Normalize').first().json || {};
  } catch (e) {
    ticket = $input.first().json || {};
  }

  let orderLookup = [];
  try {
    const lookupNode = $('Lookup Order');
    if (lookupNode && lookupNode.all) {
      orderLookup = lookupNode.all().map(i => i.json);
    }
  } catch (e) {
    orderLookup = [];
  }

  const result = verifyIdentity(ticket, orderLookup);
  return [{ json: result }];
}
