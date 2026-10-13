import 'server-only';
import { getSupabase } from '@/lib/supabase/server';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketSource,
  TicketNoteKind,
} from './constants';
import {
  CreateTicketInput,
  UpdateTicketInput,
  AddNoteInput,
  ListTicketsFilter,
  CreateTicketSchema,
  UpdateTicketSchema,
  AddNoteSchema,
  ListTicketsFilterSchema,
} from './schema';

export interface Ticket {
  id: string;
  ticket_id: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  order_id: string | null;
  order_uuid: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  summary: string;
  details: string | null;
  source: TicketSource;
  is_handoff: boolean;
  identity_verified: boolean;
  conversation_id: string | null;
  assigned_to: string | null;
  linked_claim_id: string | null;
  dedupe_key: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketNote {
  id: string;
  ticket_uuid: string;
  author: string;
  kind: TicketNoteKind;
  body: string;
  created_at: string;
}

export interface TicketCounts {
  total: number;
  new: number;
  handoff_new: number;
  in_progress: number;
  urgent_open: number;
}

export interface ListTicketsResult {
  tickets: Ticket[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export type RepoResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

/**
 * Escapes characters for safe PostgREST ilike queries
 */
export function escapeSearchTerm(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();
}

/**
 * Creates a support ticket via create_ticket RPC
 */
export async function createTicket(
  rawInput: unknown
): Promise<RepoResult<{ id: string; ticket_id: string; duplicate: boolean }>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database client is not configured' };
  }

  const parsed = CreateTicketSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(i => i.message).join('; ') };
  }

  const input = parsed.data;

  try {
    const { data, error } = await supabase.rpc('create_ticket', {
      p: {
        customer_name: input.customer_name,
        email: input.email,
        phone: input.phone,
        order_id: input.order_id,
        order_uuid: input.order_uuid,
        category: input.category,
        priority: input.priority,
        summary: input.summary,
        details: input.details,
        source: input.source,
        is_handoff: input.is_handoff,
        identity_verified: input.identity_verified,
        conversation_id: input.conversation_id,
        dedupe_key: input.dedupe_key,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        ticket_id: data.ticket_id,
        duplicate: Boolean(data.duplicate),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create ticket' };
  }
}

/**
 * Updates a support ticket via update_ticket RPC
 */
export async function updateTicket(
  ticketUuid: string,
  rawChanges: unknown,
  author = 'Team'
): Promise<RepoResult<Ticket>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database client is not configured' };
  }

  const parsed = UpdateTicketSchema.safeParse(rawChanges);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(i => i.message).join('; ') };
  }

  const changes = parsed.data;
  const effectiveAuthor = changes.author || author;

  const payload: Record<string, unknown> = {};
  if (changes.status !== undefined) payload.status = changes.status;
  if (changes.priority !== undefined) payload.priority = changes.priority;
  if (changes.category !== undefined) payload.category = changes.category;
  if (changes.summary !== undefined) payload.summary = changes.summary;
  if (changes.details !== undefined) payload.details = changes.details;
  if (changes.assigned_to !== undefined) payload.assigned_to = changes.assigned_to;

  try {
    const { data, error } = await supabase.rpc('update_ticket', {
      p_ticket_uuid: ticketUuid,
      p_changes: payload,
      p_author: effectiveAuthor,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Ticket };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update ticket' };
  }
}

/**
 * Adds a note to a ticket via add_ticket_note RPC
 */
export async function addNote(
  ticketUuid: string,
  body: string,
  author = 'Team',
  kind: TicketNoteKind = 'note'
): Promise<RepoResult<TicketNote>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database client is not configured' };
  }

  const parsed = AddNoteSchema.safeParse({
    ticket_uuid: ticketUuid,
    author,
    kind,
    body,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(i => i.message).join('; ') };
  }

  const input = parsed.data;

  try {
    const { data, error } = await supabase.rpc('add_ticket_note', {
      p_ticket_uuid: input.ticket_uuid,
      p_author: input.author,
      p_kind: input.kind,
      p_body: input.body,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as TicketNote };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add note' };
  }
}

/**
 * Retrieves a single ticket with its timeline notes
 */
export async function getTicket(
  idOrTicketId: string
): Promise<RepoResult<(Ticket & { notes: TicketNote[] }) | null>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database client is not configured' };
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrTicketId
    );

    let query = supabase.from('tickets').select('*');
    if (isUuid) {
      query = query.eq('id', idOrTicketId);
    } else {
      query = query.eq('ticket_id', idOrTicketId);
    }

    const { data: ticket, error: ticketError } = await query.maybeSingle();

    if (ticketError) {
      return { success: false, error: ticketError.message };
    }

    if (!ticket) {
      return { success: true, data: null };
    }

    const { data: notes, error: notesError } = await supabase
      .from('ticket_notes')
      .select('*')
      .eq('ticket_uuid', ticket.id)
      .order('created_at', { ascending: false });

    if (notesError) {
      return { success: false, error: notesError.message };
    }

    return {
      success: true,
      data: {
        ...(ticket as Ticket),
        notes: (notes || []) as TicketNote[],
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch ticket' };
  }
}

/**
 * Lists tickets with sorting, pagination, and multi-field filters
 */
export async function listTickets(
  rawFilters: unknown = {}
): Promise<RepoResult<ListTicketsResult>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database client is not configured' };
  }

  const parsed = ListTicketsFilterSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(i => i.message).join('; ') };
  }

  const filters = parsed.data;
  const page = filters.page;
  const limit = filters.limit;

  try {
    let query = supabase.from('tickets').select('*', { count: 'exact' });

    // Handoff inbox mode: is_handoff = true AND status = 'new'
    if (filters.handoffInbox) {
      query = query.eq('is_handoff', true).eq('status', 'new');
    } else {
      if (filters.status) query = query.eq('status', filters.status);
    }

    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.source) query = query.eq('source', filters.source);
    if (filters.assignee) query = query.ilike('assigned_to', `%${escapeSearchTerm(filters.assignee)}%`);

    // Multi-column search
    if (filters.search) {
      const cleanSearch = escapeSearchTerm(filters.search);
      if (cleanSearch) {
        query = query.or(
          `ticket_id.ilike.%${cleanSearch}%,customer_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,order_id.ilike.%${cleanSearch}%,summary.ilike.%${cleanSearch}%`
        );
      }
    }

    // Sort options
    if (filters.handoffInbox) {
      // Handoff inbox shows oldest first
      query = query.order('created_at', { ascending: true });
    } else if (filters.sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (filters.sort === 'priority') {
      // Sort priority in descending urgency order
      query = query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      // Default newest
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      success: true,
      data: {
        tickets: (data || []) as Ticket[],
        totalCount,
        page,
        totalPages,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to list tickets' };
  }
}

/**
 * Fetches dashboard KPI counts via ticket_counts RPC
 */
export async function getCounts(): Promise<RepoResult<TicketCounts>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database client is not configured' };
  }

  try {
    const { data, error } = await supabase.rpc('ticket_counts');

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        total: Number(data.total || 0),
        new: Number(data.new || 0),
        handoff_new: Number(data.handoff_new || 0),
        in_progress: Number(data.in_progress || 0),
        urgent_open: Number(data.urgent_open || 0),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to get ticket counts' };
  }
}

/**
 * Deletes a ticket by UUID (cascades ticket_notes)
 */
export async function deleteTicket(ticketUuid: string): Promise<RepoResult<{ deleted: boolean }>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database client is not configured' };
  }

  try {
    const { error } = await supabase.from('tickets').delete().eq('id', ticketUuid);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { deleted: true } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete ticket' };
  }
}
