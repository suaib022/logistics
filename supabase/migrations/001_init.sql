create extension if not exists pgcrypto;

create sequence if not exists order_seq start 100001;
create sequence if not exists quote_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null
    default ('CKT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_seq')::text, 6, '0')),
  customer_name text not null,
  company_name text,
  email text not null,
  phone text,
  origin text not null,
  destination text not null,
  shipping_method text not null check (shipping_method in ('ocean','air','road','multimodal')),
  cargo_description text,
  weight_kg numeric(12,2),
  packages integer,
  preferred_departure_date date,
  estimated_delivery_date date,
  amount numeric(14,2),
  currency text not null default 'USD',
  quote_ref text,
  notes text,
  consent_to_contact boolean not null default true,
  source text not null default 'dashboard' check (source in ('dashboard','website','voice_agent','chat_agent')),
  status text not null default 'order_placed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_uuid uuid not null references orders(id) on delete cascade,
  status text not null,
  location text,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on order_events (order_uuid, occurred_at desc);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_id text unique not null
    default ('QT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('quote_seq')::text, 4, '0')),
  full_name text not null,
  company_name text,
  work_email text not null,
  phone_number text,
  origin text not null,
  destination text not null,
  shipping_method text not null check (shipping_method in ('ocean','air','road','multimodal')),
  estimated_weight text,
  preferred_departure_date date,
  additional_details text,
  consent_to_contact boolean not null default true,
  source text not null default 'dashboard' check (source in ('dashboard','website','voice_agent','chat_agent')),
  quoted_amount numeric(14,2),
  currency text not null default 'USD',
  valid_until date,
  internal_notes text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orders enable row level security;
alter table order_events enable row level security;
alter table quotes enable row level security;

-- CHECK constraints for statuses
alter table orders add constraint check_order_status check (
  status in (
    'order_placed', 'pending_approval', 'order_approved', 'booking_confirmed', 'documents_pending', 'documents_verified',
    'pickup_scheduled', 'picked_up', 'received_at_origin_facility', 'export_customs_clearance', 'ready_for_dispatch',
    'departed_origin', 'in_transit', 'arrived_at_transit_hub', 'departed_transit_hub', 'arrived_at_destination',
    'import_customs_clearance', 'customs_cleared', 'out_for_delivery', 'delivery_attempted', 'delivered',
    'on_hold', 'customs_hold', 'delayed', 'damaged', 'lost', 'returned_to_sender', 'cancelled', 'rejected'
  )
);

alter table order_events add constraint check_order_event_status check (
  status in (
    'order_placed', 'pending_approval', 'order_approved', 'booking_confirmed', 'documents_pending', 'documents_verified',
    'pickup_scheduled', 'picked_up', 'received_at_origin_facility', 'export_customs_clearance', 'ready_for_dispatch',
    'departed_origin', 'in_transit', 'arrived_at_transit_hub', 'departed_transit_hub', 'arrived_at_destination',
    'import_customs_clearance', 'customs_cleared', 'out_for_delivery', 'delivery_attempted', 'delivered',
    'on_hold', 'customs_hold', 'delayed', 'damaged', 'lost', 'returned_to_sender', 'cancelled', 'rejected'
  )
);

alter table quotes add constraint check_quote_status check (
  status in (
    'new', 'under_review', 'rates_prepared', 'sent_to_customer', 'accepted', 'rejected', 'expired', 'cancelled'
  )
);

-- Triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_orders_updated_at
before update on orders
for each row execute function update_updated_at_column();

create trigger update_quotes_updated_at
before update on quotes
for each row execute function update_updated_at_column();

-- Trigger for initial order event
create or replace function insert_initial_order_event()
returns trigger as $$
begin
  insert into order_events (order_uuid, status, note, occurred_at)
  values (new.id, new.status, 'Order created', now());
  return new;
end;
$$ language plpgsql;

create trigger tr_insert_initial_order_event
after insert on orders
for each row execute function insert_initial_order_event();

-- Function to add order event and update order status atomically
create or replace function add_order_event(
  p_order_uuid uuid,
  p_status text,
  p_location text,
  p_note text,
  p_occurred_at timestamptz
) returns void language plpgsql security definer as $$
declare
  v_latest_status text;
begin
  -- Insert the new event
  insert into order_events (order_uuid, status, location, note, occurred_at)
  values (p_order_uuid, p_status, p_location, p_note, p_occurred_at);

  -- Determine the latest status based on occurred_at
  select status into v_latest_status
  from order_events
  where order_uuid = p_order_uuid
  order by occurred_at desc, created_at desc
  limit 1;

  -- Update the order's status and updated_at
  update orders
  set status = v_latest_status,
      updated_at = now()
  where id = p_order_uuid;
end;
$$;
