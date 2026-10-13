import { z } from 'zod';
import { isValidQuoteId } from './ids';
import { ORDER_STATUS_MAP, QUOTE_STATUS_MAP } from './status';

const SHIPPING_METHODS = ['ocean', 'air', 'road', 'multimodal'] as const;

export const OrderSchema = z.object({
  customer_name: z.string().min(1, 'Full Name is required'),
  company_name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  shipping_method: z.enum(SHIPPING_METHODS, { message: 'Shipping method is required' }),
  cargo_description: z.string().optional(),
  weight_kg: z.union([z.coerce.number().nonnegative('Weight must be non-negative'), z.literal('')]).transform(v => v === '' ? null : v).optional(),
  packages: z.union([z.coerce.number().int().nonnegative(), z.literal('')]).transform(v => v === '' ? null : v).optional(),
  preferred_departure_date: z.string().transform(v => v === '' ? null : v).nullable().optional(),
  estimated_delivery_date: z.string().transform(v => v === '' ? null : v).nullable().optional(),
  amount: z.union([z.coerce.number().nonnegative('Amount must be non-negative'), z.literal('')]).transform(v => v === '' ? null : v).optional(),
  currency: z.string().default('USD'),
  quote_ref: z.string().transform(v => v === '' ? null : v).nullable().optional().refine(val => !val || isValidQuoteId(val), { message: 'Invalid quote ID format (QT-YYYY-NNNN)' }),
  notes: z.string().optional(),
  consent_to_contact: z.boolean().default(true),
  status: z.string().refine(val => ORDER_STATUS_MAP.has(val as any), { message: 'Invalid status' }).default('order_placed'),
}).refine(data => {
  if (data.preferred_departure_date && data.estimated_delivery_date) {
    return new Date(data.estimated_delivery_date) >= new Date(data.preferred_departure_date);
  }
  return true;
}, {
  message: 'Estimated delivery date cannot be before preferred departure date',
  path: ['estimated_delivery_date']
});

export const QuoteSchema = z.object({
  full_name: z.string().min(1, 'Full Name is required'),
  company_name: z.string().optional(),
  work_email: z.string().email('Invalid email address'),
  phone_number: z.string().optional(),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  shipping_method: z.enum(SHIPPING_METHODS, { message: 'Shipping method is required' }),
  estimated_weight: z.string().optional(),
  preferred_departure_date: z.string().transform(v => v === '' ? null : v).nullable().optional(),
  additional_details: z.string().optional(),
  consent_to_contact: z.boolean().default(true).refine(val => val === true, { message: 'Consent is required' }),
  status: z.string().refine(val => QUOTE_STATUS_MAP.has(val as any), { message: 'Invalid status' }).default('new'),
  quoted_amount: z.union([z.coerce.number().nonnegative(), z.literal('')]).transform(v => v === '' ? null : v).optional(),
  currency: z.string().default('USD'),
  valid_until: z.string().transform(v => v === '' ? null : v).nullable().optional(),
  internal_notes: z.string().optional(),
});
