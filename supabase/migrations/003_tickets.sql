create sequence if not exists ticket_seq start 1001;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_id text unique not null
    default ('TKT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('ticket_seq')::text, 4, '0')),
  customer_name text not null,
  email text,
  phone text,
  order_id text,
  order_uuid uuid references orders(id) on delete set null,
  category text not null default 'other' check (category in
    ('unanswered_question','complaint','delay','damage_claim','billing','quote_followup','callback_request','customs_legal','other')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'new' check (status in
    ('new','open','waiting_on_customer','in_progress','resolved','closed')),
  summary text not null check (char_length(summary) between 3 and 200),
  details text,
  source text not null default 'dashboard' check (source in ('dashboard','website','chat_agent','voice_agent')),
  is_handoff boolean not null default false,
  identity_verified boolean not null default false,
  conversation_id text,
  assigned_to text,
  linked_claim_id text,
  dedupe_key text unique,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on tickets (status, created_at desc);
create index on tickets (is_handoff, status, created_at);
create index on tickets (order_uuid);

create table ticket_notes (
  id uuid primary key default gen_random_uuid(),
  ticket_uuid uuid not null references tickets(id) on delete cascade,
  author text not null default 'system',
  kind text not null default 'note' check (kind in ('note','status_change','assignment','system','transcript')),
  body text not null check (char_length(body) between 1 and 30000),
  created_at timestamptz not null default now()
);
create index on ticket_notes (ticket_uuid, created_at desc);

alter table tickets enable row level security;
alter table ticket_notes enable row level security;

-- updated_at trigger on tickets
drop trigger if exists update_tickets_updated_at on tickets;
create trigger update_tickets_updated_at
before update on tickets
for each row execute function set_updated_at();

-- AFTER INSERT trigger on tickets: system note "Ticket created via <source>"
create or replace function insert_initial_ticket_note()
returns trigger language plpgsql security definer as $$
begin
  insert into ticket_notes (ticket_uuid, author, kind, body, created_at)
  values (new.id, 'system', 'system', 'Ticket created via ' || new.source, now());
  return new;
end;
$$;

drop trigger if exists tr_insert_initial_ticket_note on tickets;
create trigger tr_insert_initial_ticket_note
after insert on tickets
for each row execute function insert_initial_ticket_note();

-- create_ticket RPC
create or replace function create_ticket(p jsonb)
returns jsonb language plpgsql security definer as $$
declare
  v_customer_name text;
  v_email text;
  v_phone text;
  v_order_id text;
  v_order_uuid uuid;
  v_category text;
  v_priority text;
  v_summary text;
  v_details text;
  v_source text;
  v_is_handoff boolean;
  v_identity_verified boolean;
  v_conversation_id text;
  v_dedupe_key text;
  v_id uuid;
  v_ticket_id text;
begin
  -- Trim strings; empty strings become null
  v_customer_name := nullif(trim(p->>'customer_name'), '');
  v_email := nullif(trim(p->>'email'), '');
  v_phone := nullif(trim(p->>'phone'), '');
  v_order_id := nullif(trim(p->>'order_id'), '');

  if nullif(trim(p->>'order_uuid'), '') is not null then
    v_order_uuid := (p->>'order_uuid')::uuid;
  else
    v_order_uuid := null;
  end if;

  v_category := coalesce(nullif(trim(p->>'category'), ''), 'other');
  v_priority := coalesce(nullif(trim(p->>'priority'), ''), 'normal');
  v_summary := nullif(trim(p->>'summary'), '');
  v_details := nullif(trim(p->>'details'), '');
  v_source := coalesce(nullif(trim(p->>'source'), ''), 'dashboard');
  v_is_handoff := coalesce((p->>'is_handoff')::boolean, false);
  v_identity_verified := coalesce((p->>'identity_verified')::boolean, false);
  v_conversation_id := nullif(trim(p->>'conversation_id'), '');
  v_dedupe_key := nullif(trim(p->>'dedupe_key'), '');

  -- When source is chat_agent or voice_agent, raise an exception if both email and phone are empty
  if v_source in ('chat_agent', 'voice_agent') and v_email is null and v_phone is null then
    raise exception 'At least one of email or phone is required for % tickets', v_source;
  end if;

  if v_dedupe_key is not null then
    insert into tickets (
      customer_name, email, phone, order_id, order_uuid,
      category, priority, summary, details, source,
      is_handoff, identity_verified, conversation_id, dedupe_key
    ) values (
      v_customer_name, v_email, v_phone, v_order_id, v_order_uuid,
      v_category, v_priority, v_summary, v_details, v_source,
      v_is_handoff, v_identity_verified, v_conversation_id, v_dedupe_key
    )
    on conflict (dedupe_key) do nothing
    returning id, ticket_id into v_id, v_ticket_id;

    if v_id is null then
      select id, ticket_id into v_id, v_ticket_id
      from tickets
      where dedupe_key = v_dedupe_key;

      return jsonb_build_object(
        'id', v_id,
        'ticket_id', v_ticket_id,
        'duplicate', true
      );
    else
      return jsonb_build_object(
        'id', v_id,
        'ticket_id', v_ticket_id,
        'duplicate', false
      );
    end if;
  else
    insert into tickets (
      customer_name, email, phone, order_id, order_uuid,
      category, priority, summary, details, source,
      is_handoff, identity_verified, conversation_id, dedupe_key
    ) values (
      v_customer_name, v_email, v_phone, v_order_id, v_order_uuid,
      v_category, v_priority, v_summary, v_details, v_source,
      v_is_handoff, v_identity_verified, v_conversation_id, null
    )
    returning id, ticket_id into v_id, v_ticket_id;

    return jsonb_build_object(
      'id', v_id,
      'ticket_id', v_ticket_id,
      'duplicate', false
    );
  end if;
end;
$$;

-- add_ticket_note RPC
create or replace function add_ticket_note(
  p_ticket_uuid uuid,
  p_author text,
  p_kind text,
  p_body text
) returns ticket_notes language plpgsql security definer as $$
declare
  v_note ticket_notes;
begin
  if not exists (select 1 from tickets where id = p_ticket_uuid) then
    raise exception 'Ticket % not found', p_ticket_uuid;
  end if;

  insert into ticket_notes (ticket_uuid, author, kind, body, created_at)
  values (
    p_ticket_uuid,
    coalesce(nullif(trim(p_author), ''), 'system'),
    coalesce(nullif(trim(p_kind), ''), 'note'),
    p_body,
    now()
  )
  returning * into v_note;

  return v_note;
end;
$$;

-- update_ticket RPC
create or replace function update_ticket(
  p_ticket_uuid uuid,
  p_changes jsonb,
  p_author text default 'system'
) returns tickets language plpgsql security definer as $$
declare
  v_ticket tickets;
  v_old_status text;
  v_new_status text;
  v_old_assigned_to text;
  v_new_assigned_to text;
  v_status_changed boolean := false;
  v_assignment_changed boolean := false;
  v_resolved_at timestamptz;
  v_author text;
begin
  select * into v_ticket from tickets where id = p_ticket_uuid for update;
  if not found then
    raise exception 'Ticket % not found', p_ticket_uuid;
  end if;

  v_author := coalesce(nullif(trim(p_author), ''), 'system');
  v_old_status := v_ticket.status;
  v_new_status := v_ticket.status;
  v_old_assigned_to := v_ticket.assigned_to;
  v_new_assigned_to := v_ticket.assigned_to;
  v_resolved_at := v_ticket.resolved_at;

  -- Validate & apply status
  if p_changes ? 'status' then
    v_new_status := nullif(trim(p_changes->>'status'), '');
    if v_new_status not in ('new','open','waiting_on_customer','in_progress','resolved','closed') then
      raise exception 'Invalid status: %', v_new_status;
    end if;
    if v_new_status is distinct from v_old_status then
      v_status_changed := true;
      if v_new_status in ('resolved', 'closed') then
        v_resolved_at := coalesce(v_ticket.resolved_at, now());
      else
        v_resolved_at := null; -- cleared when reopened
      end if;
    end if;
    v_ticket.status := v_new_status;
    v_ticket.resolved_at := v_resolved_at;
  end if;

  -- Validate & apply priority
  if p_changes ? 'priority' then
    v_ticket.priority := nullif(trim(p_changes->>'priority'), '');
    if v_ticket.priority not in ('low','normal','high','urgent') then
      raise exception 'Invalid priority: %', v_ticket.priority;
    end if;
  end if;

  -- Validate & apply category
  if p_changes ? 'category' then
    v_ticket.category := nullif(trim(p_changes->>'category'), '');
    if v_ticket.category not in ('unanswered_question','complaint','delay','damage_claim','billing','quote_followup','callback_request','customs_legal','other') then
      raise exception 'Invalid category: %', v_ticket.category;
    end if;
  end if;

  -- Validate & apply summary
  if p_changes ? 'summary' then
    v_ticket.summary := trim(p_changes->>'summary');
    if char_length(v_ticket.summary) not between 3 and 200 then
      raise exception 'Summary must be between 3 and 200 characters';
    end if;
  end if;

  -- Apply details
  if p_changes ? 'details' then
    v_ticket.details := nullif(trim(p_changes->>'details'), '');
  end if;

  -- Apply assigned_to
  if p_changes ? 'assigned_to' then
    v_new_assigned_to := nullif(trim(p_changes->>'assigned_to'), '');
    if v_new_assigned_to is distinct from v_old_assigned_to then
      v_assignment_changed := true;
    end if;
    v_ticket.assigned_to := v_new_assigned_to;
  end if;

  -- Update the ticket record
  update tickets
  set status = v_ticket.status,
      priority = v_ticket.priority,
      category = v_ticket.category,
      summary = v_ticket.summary,
      details = v_ticket.details,
      assigned_to = v_ticket.assigned_to,
      resolved_at = v_ticket.resolved_at,
      updated_at = now()
  where id = p_ticket_uuid
  returning * into v_ticket;

  -- Write status_change note
  if v_status_changed then
    insert into ticket_notes (ticket_uuid, author, kind, body, created_at)
    values (
      p_ticket_uuid,
      v_author,
      'status_change',
      'Status: ' || v_old_status || ' to ' || v_new_status,
      now()
    );
  end if;

  -- Write assignment note
  if v_assignment_changed then
    insert into ticket_notes (ticket_uuid, author, kind, body, created_at)
    values (
      p_ticket_uuid,
      v_author,
      'assignment',
      case 
        when v_new_assigned_to is not null then 'Assigned to ' || v_new_assigned_to
        else 'Unassigned'
      end,
      now()
    );
  end if;

  return v_ticket;
end;
$$;

-- ticket_counts RPC
create or replace function ticket_counts()
returns jsonb language plpgsql security definer as $$
declare
  v_counts jsonb;
begin
  select jsonb_build_object(
    'total', coalesce(count(*), 0)::int,
    'new', coalesce(count(*) filter (where status = 'new'), 0)::int,
    'handoff_new', coalesce(count(*) filter (where is_handoff = true and status = 'new'), 0)::int,
    'in_progress', coalesce(count(*) filter (where status = 'in_progress'), 0)::int,
    'urgent_open', coalesce(count(*) filter (where priority = 'urgent' and status not in ('resolved', 'closed')), 0)::int
  ) into v_counts
  from tickets;

  return coalesce(v_counts, jsonb_build_object(
    'total', 0,
    'new', 0,
    'handoff_new', 0,
    'in_progress', 0,
    'urgent_open', 0
  ));
end;
$$;

-- Ensure standard Supabase roles exist for local/in-memory environments
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end $$;

-- Security: Revoke public execution, grant strictly to service_role
revoke execute on function create_ticket(jsonb) from public, anon, authenticated;
grant execute on function create_ticket(jsonb) to service_role;

revoke execute on function add_ticket_note(uuid, text, text, text) from public, anon, authenticated;
grant execute on function add_ticket_note(uuid, text, text, text) to service_role;

revoke execute on function update_ticket(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function update_ticket(uuid, jsonb, text) to service_role;

revoke execute on function ticket_counts() from public, anon, authenticated;
grant execute on function ticket_counts() to service_role;
