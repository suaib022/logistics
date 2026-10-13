import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
  TICKET_SOURCE_VALUES,
  TICKET_NOTE_KIND_VALUES,
} from '@/lib/tickets/constants';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  AddNoteSchema,
  ListTicketsFilterSchema,
} from '@/lib/tickets/schema';
import { escapeSearchTerm } from '@/lib/tickets/repo';

describe('Tickets Typed Data Layer & Constants', () => {
  describe('Constants versus Migration Check Constraints', () => {
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '003_tickets.sql'),
      'utf8'
    );

    it('matches category check constraint in migration', () => {
      const match = migrationSql.match(/category\s+in\s*\(([^)]+)\)/i);
      expect(match).not.toBeNull();
      const migrationCategories = match![1]
        .split(',')
        .map(s => s.replace(/['"\s\n]/g, ''))
        .filter(Boolean);

      expect([...TICKET_CATEGORY_VALUES].sort()).toEqual(migrationCategories.sort());
    });

    it('matches priority check constraint in migration', () => {
      const match = migrationSql.match(/priority\s+in\s*\(([^)]+)\)/i);
      expect(match).not.toBeNull();
      const migrationPriorities = match![1]
        .split(',')
        .map(s => s.replace(/['"\s\n]/g, ''))
        .filter(Boolean);

      expect([...TICKET_PRIORITY_VALUES].sort()).toEqual(migrationPriorities.sort());
    });

    it('matches status check constraint in migration', () => {
      const match = migrationSql.match(/status\s+in\s*\(([^)]+)\)/i);
      expect(match).not.toBeNull();
      const migrationStatuses = match![1]
        .split(',')
        .map(s => s.replace(/['"\s\n]/g, ''))
        .filter(Boolean);

      expect([...TICKET_STATUS_VALUES].sort()).toEqual(migrationStatuses.sort());
    });

    it('matches source check constraint in migration', () => {
      const match = migrationSql.match(/source\s+in\s*\(([^)]+)\)/i);
      expect(match).not.toBeNull();
      const migrationSources = match![1]
        .split(',')
        .map(s => s.replace(/['"\s\n]/g, ''))
        .filter(Boolean);

      expect([...TICKET_SOURCE_VALUES].sort()).toEqual(migrationSources.sort());
    });

    it('matches note kind check constraint in migration', () => {
      const match = migrationSql.match(/kind\s+in\s*\(([^)]+)\)/i);
      expect(match).not.toBeNull();
      const migrationKinds = match![1]
        .split(',')
        .map(s => s.replace(/['"\s\n]/g, ''))
        .filter(Boolean);

      expect([...TICKET_NOTE_KIND_VALUES].sort()).toEqual(migrationKinds.sort());
    });
  });

  describe('Zod Validation Schemas', () => {
    it('CreateTicketSchema validates valid payload and applies defaults and transforms', () => {
      const result = CreateTicketSchema.safeParse({
        customer_name: '  Jane Doe  ',
        email: ' JANE@CORP.COM ',
        order_id: ' ckt-2026-100001 ',
        summary: '  Important delivery issue  ',
        category: 'delay',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer_name).toBe('Jane Doe');
        expect(result.data.email).toBe('jane@corp.com');
        expect(result.data.order_id).toBe('CKT-2026-100001');
        expect(result.data.summary).toBe('Important delivery issue');
        expect(result.data.priority).toBe('normal');
        expect(result.data.status).toBe('new');
        expect(result.data.source).toBe('dashboard');
        expect(result.data.is_handoff).toBe(false);
      }
    });

    it('CreateTicketSchema enforces contact rule for agent handoff sources', () => {
      // Chat agent without contact must fail
      const failAgent = CreateTicketSchema.safeParse({
        customer_name: 'Agent User',
        summary: 'Agent call handoff',
        source: 'chat_agent',
      });
      expect(failAgent.success).toBe(false);

      // Chat agent with phone succeeds
      const passAgent = CreateTicketSchema.safeParse({
        customer_name: 'Agent User',
        phone: '+1 555 0199',
        summary: 'Agent call handoff',
        source: 'chat_agent',
      });
      expect(passAgent.success).toBe(true);

      // Dashboard ticket without contact succeeds
      const passDash = CreateTicketSchema.safeParse({
        customer_name: 'Walk-in User',
        summary: 'Walk-in customer note',
        source: 'dashboard',
      });
      expect(passDash.success).toBe(true);
    });

    it('CreateTicketSchema enforces summary character length bounds', () => {
      const tooShort = CreateTicketSchema.safeParse({
        customer_name: 'Bob',
        summary: 'Hi',
      });
      expect(tooShort.success).toBe(false);

      const tooLong = CreateTicketSchema.safeParse({
        customer_name: 'Bob',
        summary: 'A'.repeat(201),
      });
      expect(tooLong.success).toBe(false);
    });

    it('UpdateTicketSchema validates partial updates and trims fields', () => {
      const res = UpdateTicketSchema.safeParse({
        status: 'in_progress',
        priority: 'urgent',
        assigned_to: '   ',
        author: 'Marcus',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.status).toBe('in_progress');
        expect(res.data.priority).toBe('urgent');
        expect(res.data.assigned_to).toBeNull();
        expect(res.data.author).toBe('Marcus');
      }

      // Invalid status throws
      const invalidStatus = UpdateTicketSchema.safeParse({
        status: 'completed_invalid',
      });
      expect(invalidStatus.success).toBe(false);
    });

    it('AddNoteSchema validates ticket note payload and constraints', () => {
      const valid = AddNoteSchema.safeParse({
        ticket_uuid: 'a1b2c3d4-e5f6-4a1b-8c2d-e3f4a5b6c7d8',
        body: 'Investigated shipment route.',
        kind: 'note',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.author).toBe('Team');
      }

      // Invalid UUID
      const invalidUuid = AddNoteSchema.safeParse({
        ticket_uuid: 'not-a-uuid',
        body: 'Some note text',
      });
      expect(invalidUuid.success).toBe(false);

      // Empty body
      const emptyBody = AddNoteSchema.safeParse({
        ticket_uuid: 'a1b2c3d4-e5f6-4a1b-8c2d-e3f4a5b6c7d8',
        body: '   ',
      });
      expect(emptyBody.success).toBe(false);
    });

    it('ListTicketsFilterSchema parses and coerces pagination and filter parameters', () => {
      const res = ListTicketsFilterSchema.safeParse({
        status: 'new',
        priority: 'urgent',
        page: '2',
        limit: '15',
        handoffInbox: true,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(2);
        expect(res.data.limit).toBe(15);
        expect(res.data.sort).toBe('newest');
        expect(res.data.handoffInbox).toBe(true);
      }
    });
  });

  describe('Search Term Escaping in repo.ts', () => {
    it('escapes special characters for safe SQL ilike pattern queries', () => {
      expect(escapeSearchTerm('test%query_1')).toBe('test\\%query\\_1');
      expect(escapeSearchTerm('injection, attack (or) drop')).toBe('injection attack or drop');
      expect(escapeSearchTerm('   trimmed search   ')).toBe('trimmed search');
      expect(escapeSearchTerm('back\\slash')).toBe('back\\\\slash');
    });
  });
});
