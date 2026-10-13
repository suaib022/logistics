import { z } from 'zod';
import {
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
  TICKET_SOURCE_VALUES,
  TICKET_NOTE_KIND_VALUES,
} from './constants';

export const CreateTicketSchema = z
  .object({
    customer_name: z.string().trim().min(1, 'Customer name is required'),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .optional()
      .or(z.literal(''))
      .transform(val => (val ? val.toLowerCase() : null)),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform(val => val || null),
    order_id: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform(val => (val ? val.toUpperCase() : null)),
    order_uuid: z
      .string()
      .uuid('Invalid order UUID')
      .optional()
      .or(z.literal(''))
      .transform(val => val || null),
    category: z.enum(TICKET_CATEGORY_VALUES).default('other'),
    priority: z.enum(TICKET_PRIORITY_VALUES).default('normal'),
    status: z.enum(TICKET_STATUS_VALUES).default('new'),
    summary: z
      .string()
      .trim()
      .min(3, 'Summary must be at least 3 characters')
      .max(200, 'Summary must be 200 characters or fewer'),
    details: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform(val => val || null),
    source: z.enum(TICKET_SOURCE_VALUES).default('dashboard'),
    is_handoff: z.boolean().default(false),
    identity_verified: z.boolean().default(false),
    conversation_id: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform(val => val || null),
    assigned_to: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform(val => val || null),
    dedupe_key: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform(val => val || null),
  })
  .refine(
    data => {
      // For agent handoffs, at least one of email or phone is strictly required
      if (data.source === 'chat_agent' || data.source === 'voice_agent') {
        return Boolean(data.email || data.phone);
      }
      // For manual dashboard entry, at least one of email or phone is also good practice
      return true;
    },
    {
      message: 'At least one contact method (email or phone) is required for agent tickets',
      path: ['email'],
    }
  );

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = z.object({
  status: z.enum(TICKET_STATUS_VALUES).optional(),
  priority: z.enum(TICKET_PRIORITY_VALUES).optional(),
  category: z.enum(TICKET_CATEGORY_VALUES).optional(),
  summary: z
    .string()
    .trim()
    .min(3, 'Summary must be at least 3 characters')
    .max(200, 'Summary must be 200 characters or fewer')
    .optional(),
  details: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform(val => val ?? null),
  assigned_to: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform(val => (val === '' ? null : val)),
  author: z.string().trim().default('Team'),
});

export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

export const AddNoteSchema = z.object({
  ticket_uuid: z.string().uuid('Invalid ticket UUID'),
  author: z.string().trim().min(1, 'Author is required').default('Team'),
  kind: z.enum(TICKET_NOTE_KIND_VALUES).default('note'),
  body: z
    .string()
    .trim()
    .min(1, 'Note content cannot be empty')
    .max(30000, 'Note content exceeds maximum character limit of 30,000'),
});

export type AddNoteInput = z.infer<typeof AddNoteSchema>;

export const ListTicketsFilterSchema = z.object({
  status: z.enum(TICKET_STATUS_VALUES).optional(),
  priority: z.enum(TICKET_PRIORITY_VALUES).optional(),
  category: z.enum(TICKET_CATEGORY_VALUES).optional(),
  source: z.enum(TICKET_SOURCE_VALUES).optional(),
  assignee: z.string().trim().optional(),
  search: z.string().trim().optional(),
  handoffInbox: z.boolean().optional(),
  sort: z.enum(['newest', 'oldest', 'priority']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListTicketsFilter = z.infer<typeof ListTicketsFilterSchema>;
