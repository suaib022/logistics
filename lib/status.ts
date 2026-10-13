export type OrderStatusSlug =
  | 'order_placed'
  | 'pending_approval'
  | 'order_approved'
  | 'booking_confirmed'
  | 'documents_pending'
  | 'documents_verified'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'received_at_origin_facility'
  | 'export_customs_clearance'
  | 'ready_for_dispatch'
  | 'departed_origin'
  | 'in_transit'
  | 'arrived_at_transit_hub'
  | 'departed_transit_hub'
  | 'arrived_at_destination'
  | 'import_customs_clearance'
  | 'customs_cleared'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'on_hold'
  | 'customs_hold'
  | 'delayed'
  | 'damaged'
  | 'lost'
  | 'returned_to_sender'
  | 'cancelled'
  | 'rejected';

export type QuoteStatusSlug =
  | 'new'
  | 'under_review'
  | 'rates_prepared'
  | 'sent_to_customer'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type StatusCategory =
  | 'pre_shipment'
  | 'pickup_origin'
  | 'movement'
  | 'destination_delivery'
  | 'exception'
  | 'final';

export type ColorToken =
  | 'neutral'
  | 'blue'
  | 'accent' // orange
  | 'teal'
  | 'green'
  | 'amber'
  | 'red';

export interface OrderStatus {
  slug: OrderStatusSlug;
  label: string;
  category: StatusCategory;
  color: ColorToken;
  icon?: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  // Pre-shipment (neutral gray)
  { slug: 'order_placed', label: 'Order Placed', category: 'pre_shipment', color: 'neutral' },
  { slug: 'pending_approval', label: 'Pending Approval', category: 'pre_shipment', color: 'neutral' },
  { slug: 'order_approved', label: 'Order Approved', category: 'pre_shipment', color: 'neutral' },
  { slug: 'booking_confirmed', label: 'Booking Confirmed', category: 'pre_shipment', color: 'neutral' },
  { slug: 'documents_pending', label: 'Documents Pending', category: 'pre_shipment', color: 'neutral' },
  { slug: 'documents_verified', label: 'Documents Verified', category: 'pre_shipment', color: 'neutral' },

  // Pickup and origin (blue)
  { slug: 'pickup_scheduled', label: 'Pickup Scheduled', category: 'pickup_origin', color: 'blue' },
  { slug: 'picked_up', label: 'Picked Up', category: 'pickup_origin', color: 'blue' },
  { slug: 'received_at_origin_facility', label: 'Received at Origin Facility', category: 'pickup_origin', color: 'blue' },
  { slug: 'export_customs_clearance', label: 'Export Customs Clearance', category: 'pickup_origin', color: 'blue' },
  { slug: 'ready_for_dispatch', label: 'Ready for Dispatch', category: 'pickup_origin', color: 'blue' },

  // Movement (accent orange)
  { slug: 'departed_origin', label: 'Departed Origin', category: 'movement', color: 'accent' },
  { slug: 'in_transit', label: 'In Transit', category: 'movement', color: 'accent' },
  { slug: 'arrived_at_transit_hub', label: 'Arrived at Transit Hub', category: 'movement', color: 'accent' },
  { slug: 'departed_transit_hub', label: 'Departed Transit Hub', category: 'movement', color: 'accent' },
  { slug: 'arrived_at_destination', label: 'Arrived at Destination Port/Hub', category: 'movement', color: 'accent' },

  // Destination and delivery (teal)
  { slug: 'import_customs_clearance', label: 'Import Customs Clearance', category: 'destination_delivery', color: 'teal' },
  { slug: 'customs_cleared', label: 'Customs Cleared', category: 'destination_delivery', color: 'teal' },
  { slug: 'out_for_delivery', label: 'Out for Delivery', category: 'destination_delivery', color: 'teal' },
  { slug: 'delivery_attempted', label: 'Delivery Attempted', category: 'destination_delivery', color: 'teal' },

  // Final / Delivered (green)
  { slug: 'delivered', label: 'Delivered', category: 'final', color: 'green' },

  // Exceptions (amber)
  { slug: 'on_hold', label: 'On Hold', category: 'exception', color: 'amber' },
  { slug: 'customs_hold', label: 'Held at Customs', category: 'exception', color: 'amber' },
  { slug: 'delayed', label: 'Delayed', category: 'exception', color: 'amber' },

  // Exceptions / Final (red)
  { slug: 'damaged', label: 'Damaged', category: 'exception', color: 'red' },
  { slug: 'lost', label: 'Lost', category: 'final', color: 'red' },
  { slug: 'returned_to_sender', label: 'Returned to Sender', category: 'final', color: 'red' },
  { slug: 'cancelled', label: 'Cancelled', category: 'final', color: 'red' },
  { slug: 'rejected', label: 'Rejected', category: 'final', color: 'red' },
];

export interface QuoteStatus {
  slug: QuoteStatusSlug;
  label: string;
}

export const QUOTE_STATUSES: QuoteStatus[] = [
  { slug: 'new', label: 'New' },
  { slug: 'under_review', label: 'Under Review' },
  { slug: 'rates_prepared', label: 'Rates Prepared' },
  { slug: 'sent_to_customer', label: 'Sent to Customer' },
  { slug: 'accepted', label: 'Accepted' },
  { slug: 'rejected', label: 'Rejected' },
  { slug: 'expired', label: 'Expired' },
  { slug: 'cancelled', label: 'Cancelled' },
];

export const ORDER_STATUS_MAP = new Map<OrderStatusSlug, OrderStatus>(
  ORDER_STATUSES.map(s => [s.slug, s])
);

export const QUOTE_STATUS_MAP = new Map<QuoteStatusSlug, QuoteStatus>(
  QUOTE_STATUSES.map(s => [s.slug, s])
);

export function getOrderStatus(slug: string): OrderStatus | undefined {
  return ORDER_STATUS_MAP.get(slug as OrderStatusSlug);
}

export function getQuoteStatus(slug: string): QuoteStatus | undefined {
  return QUOTE_STATUS_MAP.get(slug as QuoteStatusSlug);
}
