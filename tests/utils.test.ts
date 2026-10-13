import { describe, it, expect } from 'vitest';
import { normalizeOrderId } from '../lib/ids';
import { OrderSchema, QuoteSchema } from '../lib/validation';
import { ORDER_STATUSES, QUOTE_STATUSES, getOrderStatus } from '../lib/status';

describe('normalizeOrderId', () => {
  it('normalizes valid ids with dashes', () => {
    expect(normalizeOrderId('CKT-2026-100001')).toBe('CKT-2026-100001');
  });
  it('normalizes valid ids without dashes', () => {
    expect(normalizeOrderId('CKT2026100001')).toBe('CKT-2026-100001');
  });
  it('normalizes lowercase ids', () => {
    expect(normalizeOrderId('ckt-2026-100001')).toBe('CKT-2026-100001');
    expect(normalizeOrderId('ckt2026100001')).toBe('CKT-2026-100001');
  });
  it('handles spaces', () => {
    expect(normalizeOrderId(' CKT 2026 100001 ')).toBe('CKT-2026-100001');
  });
  it('returns invalid format as is', () => {
    expect(normalizeOrderId('INVALID-ID')).toBe('INVALID-ID');
  });
});

describe('validation schemas', () => {
  it('validates a correct order', () => {
    const valid = {
      customer_name: 'Test',
      email: 'test@example.com',
      origin: 'A',
      destination: 'B',
      shipping_method: 'ocean',
      preferred_departure_date: '2026-01-01',
      estimated_delivery_date: '2026-01-10',
      weight_kg: 10,
      amount: 100
    };
    expect(OrderSchema.safeParse(valid).success).toBe(true);
  });
  
  it('fails if delivery is before departure', () => {
    const invalid = {
      customer_name: 'Test',
      email: 'test@example.com',
      origin: 'A',
      destination: 'B',
      shipping_method: 'ocean',
      preferred_departure_date: '2026-01-10',
      estimated_delivery_date: '2026-01-01',
    };
    expect(OrderSchema.safeParse(invalid).success).toBe(false);
  });
  
  it('fails on negative numbers', () => {
    const invalid = {
      customer_name: 'Test',
      email: 'test@example.com',
      origin: 'A',
      destination: 'B',
      shipping_method: 'ocean',
      weight_kg: -10,
    };
    expect(OrderSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('status constants', () => {
  it('every order status has required fields', () => {
    for (const status of ORDER_STATUSES) {
      expect(status.label).toBeDefined();
      expect(status.category).toBeDefined();
      expect(status.color).toBeDefined();
    }
  });

  it('every quote status has required fields', () => {
    for (const status of QUOTE_STATUSES) {
      expect(status.label).toBeDefined();
    }
  });

  it('terminal lists are correct', () => {
    const terminal = ['delivered', 'cancelled', 'rejected', 'lost', 'returned_to_sender'];
    for (const s of terminal) {
      expect(getOrderStatus(s)?.category).toBe('final');
    }
  });
});
