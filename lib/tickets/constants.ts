export const TICKET_CATEGORY_VALUES = [
  'unanswered_question',
  'complaint',
  'delay',
  'damage_claim',
  'billing',
  'quote_followup',
  'callback_request',
  'customs_legal',
  'other',
] as const;

export type TicketCategory = (typeof TICKET_CATEGORY_VALUES)[number];

export interface CategoryMeta {
  value: TicketCategory;
  label: string;
}

export const TICKET_CATEGORIES: Record<TicketCategory, CategoryMeta> = {
  unanswered_question: { value: 'unanswered_question', label: 'Unanswered Question' },
  complaint: { value: 'complaint', label: 'Complaint' },
  delay: { value: 'delay', label: 'Delay' },
  damage_claim: { value: 'damage_claim', label: 'Damage Claim' },
  billing: { value: 'billing', label: 'Billing' },
  quote_followup: { value: 'quote_followup', label: 'Quote Follow-up' },
  callback_request: { value: 'callback_request', label: 'Callback Request' },
  customs_legal: { value: 'customs_legal', label: 'Customs & Legal' },
  other: { value: 'other', label: 'Other' },
};

export const TICKET_PRIORITY_VALUES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITY_VALUES)[number];

export interface PriorityMeta {
  value: TicketPriority;
  label: string;
  badgeVariant: 'neutral' | 'blue' | 'amber' | 'red';
}

export const TICKET_PRIORITIES: Record<TicketPriority, PriorityMeta> = {
  low: { value: 'low', label: 'Low', badgeVariant: 'neutral' },
  normal: { value: 'normal', label: 'Normal', badgeVariant: 'blue' },
  high: { value: 'high', label: 'High', badgeVariant: 'amber' },
  urgent: { value: 'urgent', label: 'Urgent', badgeVariant: 'red' },
};

export const TICKET_STATUS_VALUES = [
  'new',
  'open',
  'waiting_on_customer',
  'in_progress',
  'resolved',
  'closed',
] as const;
export type TicketStatus = (typeof TICKET_STATUS_VALUES)[number];

export interface StatusMeta {
  value: TicketStatus;
  label: string;
  badgeVariant: 'neutral' | 'blue' | 'amber' | 'teal' | 'green' | 'red';
}

export const TICKET_STATUSES: Record<TicketStatus, StatusMeta> = {
  new: { value: 'new', label: 'New', badgeVariant: 'blue' },
  open: { value: 'open', label: 'Open', badgeVariant: 'teal' },
  waiting_on_customer: { value: 'waiting_on_customer', label: 'Waiting on Customer', badgeVariant: 'amber' },
  in_progress: { value: 'in_progress', label: 'In Progress', badgeVariant: 'amber' },
  resolved: { value: 'resolved', label: 'Resolved', badgeVariant: 'green' },
  closed: { value: 'closed', label: 'Closed', badgeVariant: 'neutral' },
};

export const TICKET_SOURCE_VALUES = ['dashboard', 'website', 'chat_agent', 'voice_agent'] as const;
export type TicketSource = (typeof TICKET_SOURCE_VALUES)[number];

export interface SourceMeta {
  value: TicketSource;
  label: string;
}

export const TICKET_SOURCES: Record<TicketSource, SourceMeta> = {
  dashboard: { value: 'dashboard', label: 'Dashboard' },
  website: { value: 'website', label: 'Website' },
  chat_agent: { value: 'chat_agent', label: 'Chat Agent' },
  voice_agent: { value: 'voice_agent', label: 'Voice Agent' },
};

export const TICKET_NOTE_KIND_VALUES = [
  'note',
  'status_change',
  'assignment',
  'system',
  'transcript',
] as const;
export type TicketNoteKind = (typeof TICKET_NOTE_KIND_VALUES)[number];
