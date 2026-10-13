-- Seed 12 Orders with varied statuses and timelines
-- Note: the after insert trigger on orders automatically inserts the first event ('Order created' at now())
-- so for seed data we need to be careful with occurred_at if we want past timelines.
-- We will insert orders, then manually insert past events using add_order_event which updates the status.
-- However, we must disable or work around the initial trigger if we want the 'Order created' event to be in the past.
-- Given it's a seed script, we can just update the order_events created by the trigger, or let the trigger fire at now() and then add newer events at now() + interval.
-- Let's just insert orders, and then use `add_order_event` to build the timeline forward.
-- To make timelines look realistic, we'll shift the initial event's occurred_at back in time.

-- Clean up any existing data if re-running
truncate table order_events, orders, quotes restart identity cascade;

DO $$ 
DECLARE 
  o1 uuid; o2 uuid; o3 uuid; o4 uuid; o5 uuid; o6 uuid; o7 uuid; o8 uuid; o9 uuid; o10 uuid; o11 uuid; o12 uuid;
BEGIN
  -- Insert 12 Orders
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Alice Smith', 'Acme Corp', 'alice@acme.com', '555-0101', 'Shanghai', 'Los Angeles', 'ocean', 15000.00, 10, 'order_placed') returning id into o1;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Bob Jones', 'Globex', 'bob@globex.com', '555-0102', 'Rotterdam', 'New York', 'ocean', 8500.50, 5, 'order_placed') returning id into o2;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Charlie Davis', 'Initech', 'charlie@initech.com', '555-0103', 'Singapore', 'London', 'air', 120.00, 2, 'order_placed') returning id into o3;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Diana Prince', 'Stark Ind', 'diana@stark.com', '555-0104', 'Dubai', 'Hamburg', 'ocean', 22000.00, 15, 'order_placed') returning id into o4;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Evan Wright', 'Wayne Ent', 'evan@wayne.com', '555-0105', 'Tokyo', 'San Francisco', 'air', 450.00, 3, 'order_placed') returning id into o5;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Fiona Gallagher', 'Umbrella', 'fiona@umbrella.com', '555-0106', 'Shenzhen', 'Sydney', 'ocean', 18000.00, 12, 'order_placed') returning id into o6;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('George Miller', 'Soylent', 'george@soylent.com', '555-0107', 'Mumbai', 'Rotterdam', 'ocean', 9000.00, 8, 'order_placed') returning id into o7;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Hannah Abbott', 'Massive Dyn', 'hannah@massive.com', '555-0108', 'Frankfurt', 'Chicago', 'air', 80.00, 1, 'order_placed') returning id into o8;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Ian Malcolm', 'InGen', 'ian@ingen.com', '555-0109', 'Los Angeles', 'Tokyo', 'ocean', 14000.00, 9, 'order_placed') returning id into o9;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Julia Chang', 'Mishima', 'julia@mishima.com', '555-0110', 'Seoul', 'Vancouver', 'ocean', 16000.00, 11, 'order_placed') returning id into o10;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Kevin Flynn', 'ENCOM', 'kevin@encom.com', '555-0111', 'London', 'Dubai', 'air', 300.00, 4, 'order_placed') returning id into o11;
  
  insert into orders (customer_name, company_name, email, phone, origin, destination, shipping_method, weight_kg, packages, status)
  values 
  ('Laura Roslin', 'Caprica', 'laura@caprica.com', '555-0112', 'Houston', 'Hamburg', 'ocean', 25000.00, 20, 'order_placed') returning id into o12;

  -- Backdate the initial events created by the trigger
  update order_events set occurred_at = now() - interval '30 days' where order_uuid = o1;
  update order_events set occurred_at = now() - interval '25 days' where order_uuid = o2;
  update order_events set occurred_at = now() - interval '14 days' where order_uuid = o3;
  update order_events set occurred_at = now() - interval '20 days' where order_uuid = o4;
  update order_events set occurred_at = now() - interval '10 days' where order_uuid = o5;
  update order_events set occurred_at = now() - interval '40 days' where order_uuid = o6;
  update order_events set occurred_at = now() - interval '35 days' where order_uuid = o7;
  update order_events set occurred_at = now() - interval '5 days' where order_uuid = o8;
  update order_events set occurred_at = now() - interval '12 days' where order_uuid = o9;
  update order_events set occurred_at = now() - interval '60 days' where order_uuid = o10;
  update order_events set occurred_at = now() - interval '15 days' where order_uuid = o11;
  update order_events set occurred_at = now() - interval '8 days' where order_uuid = o12;

  -- 2 Delivered (o1, o2)
  perform add_order_event(o1, 'order_approved', null, 'Approved by team', now() - interval '29 days');
  perform add_order_event(o1, 'picked_up', 'Shanghai', 'Picked up from warehouse', now() - interval '28 days');
  perform add_order_event(o1, 'departed_origin', 'Shanghai Port', 'Vessel departed', now() - interval '25 days');
  perform add_order_event(o1, 'in_transit', null, 'In transit over Pacific', now() - interval '15 days');
  perform add_order_event(o1, 'arrived_at_destination', 'Los Angeles Port', 'Vessel arrived', now() - interval '5 days');
  perform add_order_event(o1, 'customs_cleared', 'Los Angeles', 'Customs cleared', now() - interval '4 days');
  perform add_order_event(o1, 'out_for_delivery', 'Los Angeles', 'Out for final delivery', now() - interval '2 days');
  perform add_order_event(o1, 'delivered', 'Los Angeles', 'Signed by receiver', now() - interval '1 day');

  perform add_order_event(o2, 'order_approved', null, 'Approved', now() - interval '24 days');
  perform add_order_event(o2, 'picked_up', 'Rotterdam', 'Picked up', now() - interval '23 days');
  perform add_order_event(o2, 'departed_origin', 'Rotterdam Port', 'Vessel departed', now() - interval '20 days');
  perform add_order_event(o2, 'arrived_at_destination', 'New York Port', 'Arrived', now() - interval '3 days');
  perform add_order_event(o2, 'delivered', 'New York', 'Delivered successfully', now() - interval '1 hour');

  -- 2 In Transit (o3, o4)
  perform add_order_event(o3, 'order_approved', null, 'Approved', now() - interval '13 days');
  perform add_order_event(o3, 'picked_up', 'Singapore', 'Picked up', now() - interval '12 days');
  perform add_order_event(o3, 'departed_origin', 'Changi Airport', 'Flight departed', now() - interval '10 days');
  perform add_order_event(o3, 'in_transit', null, 'In transit', now() - interval '5 days');

  perform add_order_event(o4, 'order_approved', null, 'Approved', now() - interval '19 days');
  perform add_order_event(o4, 'picked_up', 'Dubai', 'Picked up', now() - interval '18 days');
  perform add_order_event(o4, 'departed_origin', 'Jebel Ali', 'Vessel departed', now() - interval '15 days');
  perform add_order_event(o4, 'in_transit', null, 'Sailing', now() - interval '2 days');

  -- 1 Held at customs (o5)
  perform add_order_event(o5, 'order_approved', null, 'Approved', now() - interval '9 days');
  perform add_order_event(o5, 'picked_up', 'Tokyo', 'Picked up', now() - interval '8 days');
  perform add_order_event(o5, 'departed_origin', 'Haneda Airport', 'Flight departed', now() - interval '7 days');
  perform add_order_event(o5, 'arrived_at_destination', 'SFO', 'Arrived', now() - interval '2 days');
  perform add_order_event(o5, 'customs_hold', 'SFO Customs', 'Missing commercial invoice', now() - interval '1 day');

  -- 1 Delayed (o6)
  perform add_order_event(o6, 'order_approved', null, 'Approved', now() - interval '39 days');
  perform add_order_event(o6, 'picked_up', 'Shenzhen', 'Picked up', now() - interval '38 days');
  perform add_order_event(o6, 'departed_origin', 'Shenzhen Port', 'Departed', now() - interval '35 days');
  perform add_order_event(o6, 'delayed', null, 'Vessel delayed due to weather', now() - interval '5 days');

  -- 1 Cancelled (o10)
  perform add_order_event(o10, 'cancelled', null, 'Customer requested cancellation', now() - interval '59 days');

  -- Rest spread (o7, o8, o9, o11, o12)
  -- o7: ready_for_dispatch
  perform add_order_event(o7, 'order_approved', null, 'Approved', now() - interval '34 days');
  perform add_order_event(o7, 'ready_for_dispatch', 'Mumbai', 'Awaiting vessel', now() - interval '30 days');

  -- o8: documents_pending
  perform add_order_event(o8, 'documents_pending', null, 'Waiting for export license', now() - interval '4 days');

  -- o9: arrived_at_transit_hub
  perform add_order_event(o9, 'order_approved', null, 'Approved', now() - interval '11 days');
  perform add_order_event(o9, 'picked_up', 'Los Angeles', 'Picked up', now() - interval '10 days');
  perform add_order_event(o9, 'departed_origin', 'LAX', 'Departed', now() - interval '9 days');
  perform add_order_event(o9, 'arrived_at_transit_hub', 'Honolulu', 'Transit stop', now() - interval '1 day');

  -- o11: out_for_delivery
  perform add_order_event(o11, 'order_approved', null, 'Approved', now() - interval '14 days');
  perform add_order_event(o11, 'picked_up', 'London', 'Picked up', now() - interval '13 days');
  perform add_order_event(o11, 'departed_origin', 'Heathrow', 'Departed', now() - interval '12 days');
  perform add_order_event(o11, 'arrived_at_destination', 'DXB', 'Arrived', now() - interval '2 days');
  perform add_order_event(o11, 'out_for_delivery', 'Dubai', 'Driver dispatched', now() - interval '2 hours');

  -- o12: order_placed (no additional events)
END $$;

-- Seed 8 Quotes
insert into quotes (full_name, company_name, work_email, phone_number, origin, destination, shipping_method, estimated_weight, status)
values
('Sarah Connor', 'Cyberdyne', 'sarah@cyberdyne.com', '555-0201', 'Los Angeles', 'Mexico City', 'road', '500 kg', 'new'),
('Thomas Anderson', 'MetaCortex', 'thomas@metacortex.com', '555-0202', 'Chicago', 'Sydney', 'ocean', '2 TEU', 'under_review'),
('Bruce Wayne', 'Wayne Ent', 'bruce@wayne.com', '555-0203', 'Gotham', 'Metropolis', 'air', '100 kg', 'rates_prepared'),
('Clark Kent', 'Daily Planet', 'clark@dailyplanet.com', '555-0204', 'Metropolis', 'Paris', 'air', '50 kg', 'sent_to_customer'),
('Peter Parker', 'Daily Bugle', 'peter@bugle.com', '555-0205', 'New York', 'London', 'air', '10 kg', 'accepted'),
('Tony Stark', 'Stark Ind', 'tony@stark.com', '555-0206', 'Malibu', 'Tokyo', 'ocean', '5000 kg', 'rejected'),
('Steve Rogers', 'SHIELD', 'steve@shield.gov', '555-0207', 'Washington', 'Berlin', 'multimodal', '2000 kg', 'expired'),
('Natasha Romanoff', 'SHIELD', 'natasha@shield.gov', '555-0208', 'Moscow', 'Budapest', 'road', '300 kg', 'cancelled');
