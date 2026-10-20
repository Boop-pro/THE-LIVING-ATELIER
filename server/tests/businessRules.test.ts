import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createWallBookingSchema,
  createPotteryRequestSchema,
  updatePotteryRequestSchema,
  getCalendarDaysDifference,
} from '../src/validators';

describe('1. Authentication & RBAC Validation Rules', () => {
  it('should accept valid customer registration payload', () => {
    const result = registerSchema.safeParse({
      name: 'Maya Patel',
      email: 'maya@example.com',
      password: 'StrongPassword123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('customer');
    }
  });

  it('should reject registration if password is under 6 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Maya Patel',
      email: 'maya@example.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = registerSchema.safeParse({
      name: 'Maya Patel',
      email: 'not-an-email',
      password: 'ValidPassword123',
    });
    expect(result.success).toBe(false);
  });

  it('should prevent privilege escalation by rejecting role other than customer', () => {
    const result = registerSchema.safeParse({
      name: 'Hacker',
      email: 'hacker@example.com',
      password: 'Password123',
      role: 'studio',
    });
    expect(result.success).toBe(false);
  });

  it('should validate proper login payload', () => {
    const result = loginSchema.safeParse({
      email: 'client@example.com',
      password: 'Password123',
    });
    expect(result.success).toBe(true);
  });
});

describe('2. Wall Booking Business Rules Validation', () => {
  const getOffsetDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  it('should accept booking date between 7 and 90 calendar days', () => {
    const validDate = getOffsetDate(14); // 14 days away
    const result = createWallBookingSchema.safeParse({
      bookingDate: validDate,
      wallSizeSqFt: 150,
      serviceAddress: '104 Lotus Boulevard, Jubilee Hills, Hyderabad',
      notes: 'South-facing living room feature wall',
    });
    expect(result.success).toBe(true);
  });

  it('should reject booking date less than 7 calendar days away', () => {
    const tooSoonDate = getOffsetDate(3); // only 3 days away
    const result = createWallBookingSchema.safeParse({
      bookingDate: tooSoonDate,
      wallSizeSqFt: 150,
      serviceAddress: '104 Lotus Boulevard',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('between 7 and 90 calendar days');
    }
  });

  it('should reject booking date more than 90 calendar days away', () => {
    const tooFarDate = getOffsetDate(100); // 100 days away
    const result = createWallBookingSchema.safeParse({
      bookingDate: tooFarDate,
      wallSizeSqFt: 150,
      serviceAddress: '104 Lotus Boulevard',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('between 7 and 90 calendar days');
    }
  });

  it('should reject wall size under 10 sq ft', () => {
    const validDate = getOffsetDate(15);
    const result = createWallBookingSchema.safeParse({
      bookingDate: validDate,
      wallSizeSqFt: 5, // under 10
      serviceAddress: '104 Lotus Boulevard',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 10 square feet');
    }
  });

  it('should reject wall size exceeding 500 sq ft', () => {
    const validDate = getOffsetDate(15);
    const result = createWallBookingSchema.safeParse({
      bookingDate: validDate,
      wallSizeSqFt: 650, // over 500
      serviceAddress: '104 Lotus Boulevard',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('cannot exceed 500 square feet');
    }
  });

  it('should accurately calculate calendar day differences', () => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 10);
    expect(getCalendarDaysDifference(futureDate, today)).toBe(10);
  });
});

describe('3. Pottery Request Business Rules Validation', () => {
  const getOffsetDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  it('should accept valid pottery request with quantity 1-12 and lead time >= 14 days', () => {
    const validDate = getOffsetDate(20); // 20 days away
    const result = createPotteryRequestSchema.safeParse({
      potteryItemId: 'i-01',
      potteryGlazeId: 'g-01',
      quantity: 6,
      neededByDate: validDate,
      notes: 'Matte rim finish requested',
    });
    expect(result.success).toBe(true);
  });

  it('should reject pottery quantity of 0 or negative', () => {
    const validDate = getOffsetDate(20);
    const result = createPotteryRequestSchema.safeParse({
      potteryItemId: 'i-01',
      potteryGlazeId: 'g-01',
      quantity: 0,
      neededByDate: validDate,
    });
    expect(result.success).toBe(false);
  });

  it('should reject pottery quantity exceeding 12', () => {
    const validDate = getOffsetDate(20);
    const result = createPotteryRequestSchema.safeParse({
      potteryItemId: 'i-01',
      potteryGlazeId: 'g-01',
      quantity: 15,
      neededByDate: validDate,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Maximum quantity is 12 pieces');
    }
  });

  it('should reject non-integer pottery quantity', () => {
    const validDate = getOffsetDate(20);
    const result = createPotteryRequestSchema.safeParse({
      potteryItemId: 'i-01',
      potteryGlazeId: 'g-01',
      quantity: 2.5,
      neededByDate: validDate,
    });
    expect(result.success).toBe(false);
  });

  it('should reject needed-by date under 14 calendar days away', () => {
    const rushedDate = getOffsetDate(10); // only 10 days away
    const result = createPotteryRequestSchema.safeParse({
      potteryItemId: 'i-01',
      potteryGlazeId: 'g-01',
      quantity: 4,
      neededByDate: rushedDate,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 14 calendar days');
    }
  });

  it('should validate pottery update schema with valid changes', () => {
    const validDate = getOffsetDate(25);
    const result = updatePotteryRequestSchema.safeParse({
      quantity: 8,
      neededByDate: validDate,
      notes: 'Updated quantity to 8',
    });
    expect(result.success).toBe(true);
  });
});
