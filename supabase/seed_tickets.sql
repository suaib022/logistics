-- ==============================================================================
-- SEED DATA: 10 Support Tickets across all categories and statuses
-- Safe to run once; uses RPC functions to ensure realistic notes timeline.
-- ==============================================================================

DO $$
DECLARE
  t1 jsonb; t2 jsonb; t3 jsonb; t4 jsonb; t5 jsonb;
  t6 jsonb; t7 jsonb; t8 jsonb; t9 jsonb; t10 jsonb;
  v_uuid1 uuid; v_uuid2 uuid; v_uuid3 uuid; v_uuid4 uuid; v_uuid5 uuid;
  v_uuid6 uuid; v_uuid7 uuid; v_uuid8 uuid; v_uuid9 uuid; v_uuid10 uuid;
BEGIN
  -- Idempotency check: only seed if no tickets exist
  IF EXISTS (SELECT 1 FROM tickets LIMIT 1) THEN
    RAISE NOTICE 'Tickets table is already seeded. Skipping seed_tickets.sql.';
    RETURN;
  END IF;

  -- 1. Handoff 1: New - Delay inquiry from chat agent
  t1 := create_ticket(jsonb_build_object(
    'customer_name', 'Arthur Dent',
    'email', 'arthur.dent@hitchhiker.example',
    'phone', '+44 7700 900101',
    'order_id', 'CKT-2026-100001',
    'category', 'delay',
    'priority', 'normal',
    'summary', 'Shipment delayed at Southampton port',
    'details', 'Customer called asking why container has not departed on scheduled vessel.',
    'source', 'chat_agent',
    'is_handoff', true,
    'identity_verified', true,
    'conversation_id', 'conv_seed_101',
    'dedupe_key', 'conv_seed_101:delay:hash01'
  ));
  v_uuid1 := (t1->>'id')::uuid;

  -- Add transcript note to t1
  PERFORM add_ticket_note(
    v_uuid1,
    'system',
    'transcript',
    'Customer: Hello, I was told my shipment would depart Southampton yesterday.' || E'\n' ||
    'Agent: Let me check that for you. It looks like vessel departure was moved 48 hours due to port congestion.' || E'\n' ||
    'Customer: Could a specialist please review and confirm the new ETA?' || E'\n' ||
    'Agent: I will create a handoff ticket for our logistics support team right away.'
  );

  -- 2. Handoff 2: Urgent, In Progress - Damage claim from voice agent
  t2 := create_ticket(jsonb_build_object(
    'customer_name', 'Ford Prefect',
    'email', 'ford.prefect@sub-etha.example',
    'phone', '+44 7700 900102',
    'order_id', 'CKT-2026-100002',
    'category', 'damage_claim',
    'priority', 'urgent',
    'summary', 'Crate damaged upon arrival at Hamburg dock',
    'details', 'Receiving inspection discovered forklift puncture on primary cargo crate.',
    'source', 'voice_agent',
    'is_handoff', true,
    'identity_verified', true,
    'conversation_id', 'conv_seed_102',
    'dedupe_key', 'conv_seed_102:damage_claim:hash02'
  ));
  v_uuid2 := (t2->>'id')::uuid;

  -- Progress t2 to in_progress with assignee
  PERFORM update_ticket(
    v_uuid2,
    jsonb_build_object(
      'status', 'in_progress',
      'assigned_to', 'Sarah Connor'
    ),
    'Sarah Connor'
  );
  PERFORM add_ticket_note(
    v_uuid2,
    'Sarah Connor',
    'note',
    'Requested inspection photos and surveyor report from Hamburg terminal.'
  );

  -- Add transcript note to t2
  PERFORM add_ticket_note(
    v_uuid2,
    'system',
    'transcript',
    'Customer: Immediate attention required - crate CKT-2026-100002 was damaged during offloading!' || E'\n' ||
    'Agent: I understand this is urgent. Can you describe the visible damage?' || E'\n' ||
    'Customer: Forklift tines went through the wooden exterior into component housing.' || E'\n' ||
    'Agent: Escalating this directly as an urgent damage claim ticket.'
  );

  -- 3. Handoff 3: New - Unanswered question via chat agent
  t3 := create_ticket(jsonb_build_object(
    'customer_name', 'Tricia McMillan',
    'email', 'tricia.m@suborbital.example',
    'phone', '+1 555 0192003',
    'order_id', 'CKT-2026-100003',
    'category', 'unanswered_question',
    'priority', 'low',
    'summary', 'Inquiry regarding temperature data logger retrieval',
    'details', 'Customer wants instructions on returning sensory data loggers after unpacking.',
    'source', 'chat_agent',
    'is_handoff', true,
    'identity_verified', false,
    'conversation_id', 'conv_seed_103',
    'dedupe_key', 'conv_seed_103:unanswered_question:hash03'
  ));
  v_uuid3 := (t3->>'id')::uuid;

  -- 4. Handoff 4: Urgent, Open - Customs & Legal hold via voice agent
  t4 := create_ticket(jsonb_build_object(
    'customer_name', 'Zaphod Beeblebrox',
    'email', 'president.zaphod@galaxy.example',
    'phone', '+44 7700 900104',
    'order_id', 'CKT-2026-100004',
    'category', 'customs_legal',
    'priority', 'urgent',
    'summary', 'Urgent EUR.1 certificate clearance query',
    'details', 'Customs office in Rotterdam requesting stamped chamber of commerce documentation.',
    'source', 'voice_agent',
    'is_handoff', true,
    'identity_verified', true,
    'conversation_id', 'conv_seed_104',
    'dedupe_key', 'conv_seed_104:customs_legal:hash04'
  ));
  v_uuid4 := (t4->>'id')::uuid;

  PERFORM update_ticket(
    v_uuid4,
    jsonb_build_object('status', 'open', 'assigned_to', 'Marcus Vance'),
    'Marcus Vance'
  );
  PERFORM add_ticket_note(
    v_uuid4,
    'Marcus Vance',
    'note',
    'Contacted Rotterdam broker. Document re-transmitted via secure portal.'
  );

  -- 5. Handoff 5: Resolved - Quote followup
  t5 := create_ticket(jsonb_build_object(
    'customer_name', 'Dirk Gently',
    'email', 'dirk@holistic-detective.example',
    'phone', '+44 7700 900105',
    'category', 'quote_followup',
    'priority', 'normal',
    'summary', 'Followup on specialized heavy machinery ocean rate',
    'details', 'Customer requested rate validity extension for quotation QT-2026-1005.',
    'source', 'chat_agent',
    'is_handoff', true,
    'identity_verified', false,
    'conversation_id', 'conv_seed_105',
    'dedupe_key', 'conv_seed_105:quote_followup:hash05'
  ));
  v_uuid5 := (t5->>'id')::uuid;

  PERFORM update_ticket(
    v_uuid5,
    jsonb_build_object('status', 'in_progress', 'assigned_to', 'Elena Rostova'),
    'Elena Rostova'
  );
  PERFORM update_ticket(
    v_uuid5,
    jsonb_build_object('status', 'resolved'),
    'Elena Rostova'
  );
  PERFORM add_ticket_note(
    v_uuid5,
    'Elena Rostova',
    'note',
    'Carrier agreed to extend bunker adjustment factor rate for 14 additional days. Customer notified.'
  );

  -- 6. Non-Handoff: Open - Billing discrepancy via dashboard
  t6 := create_ticket(jsonb_build_object(
    'customer_name', 'Slartibartfast',
    'email', 'slarti@coastlines.example',
    'phone', '+47 21 00 0106',
    'order_id', 'CKT-2026-100006',
    'category', 'billing',
    'priority', 'normal',
    'summary', 'Invoice currency conversion discrepancy on fuel surcharge',
    'details', 'Customer noted fuel surcharge was invoiced in EUR instead of agreed USD contract.',
    'source', 'dashboard',
    'is_handoff', false,
    'identity_verified', true
  ));
  v_uuid6 := (t6->>'id')::uuid;

  PERFORM update_ticket(
    v_uuid6,
    jsonb_build_object('status', 'open', 'assigned_to', 'Sarah Connor'),
    'Team'
  );

  -- 7. Non-Handoff: Waiting on customer - Callback request via website
  t7 := create_ticket(jsonb_build_object(
    'customer_name', 'Marvin Paranoid',
    'email', 'marvin.android@sirius.example',
    'phone', '+1 555 0192007',
    'category', 'callback_request',
    'priority', 'low',
    'summary', 'Requesting morning callback regarding multimodal consolidation',
    'details', 'Wants to schedule a 15-minute call between 09:00 and 11:00 CET.',
    'source', 'website',
    'is_handoff', false
  ));
  v_uuid7 := (t7->>'id')::uuid;

  PERFORM update_ticket(
    v_uuid7,
    jsonb_build_object('status', 'waiting_on_customer', 'assigned_to', 'Marcus Vance'),
    'Marcus Vance'
  );
  PERFORM add_ticket_note(
    v_uuid7,
    'Marcus Vance',
    'note',
    'Sent calendar invite options for Wednesday and Thursday morning.'
  );

  -- 8. Non-Handoff: Resolved - Complaint about packaging via dashboard
  t8 := create_ticket(jsonb_build_object(
    'customer_name', 'Agrajag Reborn',
    'email', 'agrajag@incarnations.example',
    'phone', '+44 7700 900108',
    'order_id', 'CKT-2026-100008',
    'category', 'complaint',
    'priority', 'normal',
    'summary', 'Pallet strapping tension caused minor indentation on cardboard wrap',
    'details', 'Goods intact, but requested feedback to warehouse packaging supervisor.',
    'source', 'dashboard',
    'is_handoff', false,
    'identity_verified', true
  ));
  v_uuid8 := (t8->>'id')::uuid;

  PERFORM update_ticket(
    v_uuid8,
    jsonb_build_object('status', 'in_progress', 'assigned_to', 'Sarah Connor'),
    'Sarah Connor'
  );
  PERFORM update_ticket(
    v_uuid8,
    jsonb_build_object('status', 'resolved'),
    'Sarah Connor'
  );
  PERFORM add_ticket_note(
    v_uuid8,
    'Sarah Connor',
    'note',
    'Warehouse manager updated banding guidelines to use corner edge protectors on all corrugate pallets.'
  );

  -- 9. Non-Handoff: Closed - General other inquiry via website
  t9 := create_ticket(jsonb_build_object(
    'customer_name', 'Eddie Computer',
    'email', 'eddie@heart-of-gold.example',
    'phone', '+1 555 0192009',
    'category', 'other',
    'priority', 'low',
    'summary', 'API documentation request for bulk webhook status tracking',
    'details', 'Requested developer documentation for subscribing to carrier GPS pings.',
    'source', 'website',
    'is_handoff', false
  ));
  v_uuid9 := (t9->>'id')::uuid;

  PERFORM update_ticket(
    v_uuid9,
    jsonb_build_object('status', 'closed', 'assigned_to', 'Elena Rostova'),
    'Elena Rostova'
  );
  PERFORM add_ticket_note(
    v_uuid9,
    'Elena Rostova',
    'note',
    'Shared link to developer portal and generated staging webhook token.'
  );

  -- 10. Non-Handoff: In Progress - Delay notification via dashboard
  t10 := create_ticket(jsonb_build_object(
    'customer_name', 'Fenchurch Pollen',
    'email', 'fenchurch@clouds.example',
    'phone', '+44 7700 900110',
    'order_id', 'CKT-2026-100010',
    'category', 'delay',
    'priority', 'high',
    'summary', 'Rail transit delay between Lyon and Frankfurt hub',
    'details', 'Track maintenance caused freight rail diversion of 36 hours.',
    'source', 'dashboard',
    'is_handoff', false,
    'identity_verified', true
  ));
  v_uuid10 := (t10->>'id')::uuid;

  PERFORM update_ticket(
    v_uuid10,
    jsonb_build_object('status', 'in_progress', 'assigned_to', 'Marcus Vance'),
    'Marcus Vance'
  );
  PERFORM add_ticket_note(
    v_uuid10,
    'Marcus Vance',
    'note',
    'Arranged direct hot-shot road transport from Lyon to prevent missed factory assembly window.'
  );

  RAISE NOTICE 'Successfully seeded 10 support tickets!';
END $$;
