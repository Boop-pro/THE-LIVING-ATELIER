import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

// Mock Prisma for endpoint lifecycle testing
vi.mock('../src/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    painting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    paintingOrder: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wallPaintingRate: {
      findFirst: vi.fn(),
    },
    wallBooking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    potteryItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    potteryGlaze: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    potteryRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('API Endpoints Lifecycle & RBAC Tests', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.app).toBe('The Living Atelier API');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer and return JWT cookie and user object', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'cust-123',
        email: 'maya@example.com',
        name: 'Maya Patel',
        role: 'customer',
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Maya Patel',
          email: 'maya@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('customer');
      expect(res.body.token).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject registration if email is already taken', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'existing-123',
        email: 'maya@example.com',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Maya Patel',
          email: 'maya@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/paintings', () => {
    it('should return catalog of paintings without authentication', async () => {
      (prisma.painting.findMany as any).mockResolvedValue([
        {
          id: 'p-001',
          title: 'Madhubani Peacock Garden',
          price: 6500,
          status: 'available',
        },
      ]);

      const res = await request(app).get('/api/paintings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.paintings).toHaveLength(1);
    });
  });

  describe('RBAC & Ownership Security', () => {
    it('should return 401 Unauthenticated when accessing protected endpoint without token', async () => {
      const res = await request(app).get('/api/wall-bookings/my');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 Forbidden when a customer attempts an admin-only action', async () => {
      // Create a customer token
      const customerToken = jwt.sign(
        { userId: 'cust-123', email: 'cust@example.com', role: 'customer' },
        config.jwtSecret
      );

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'cust-123',
        email: 'cust@example.com',
        name: 'Regular Customer',
        role: 'customer',
      });

      const res = await request(app)
        .post('/api/paintings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Unauthorized Painting',
          artist: 'Someone',
          description: 'Test description',
          price: 5000,
          imageUrl: 'images/test.jpg',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow studio admin to access studio-protected endpoint', async () => {
      const studioToken = jwt.sign(
        { userId: 'admin-123', email: 'studio@artstudio.in', role: 'studio' },
        config.jwtSecret
      );

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-123',
        email: 'studio@artstudio.in',
        name: 'Studio Master',
        role: 'studio',
      });

      (prisma.wallBooking.findMany as any).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/wall-bookings/all')
        .set('Authorization', `Bearer ${studioToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bookings).toEqual([]);
    });
  });

  describe('Wall Booking Availability', () => {
    it('should return active booked dates and seeded rate', async () => {
      (prisma.wallPaintingRate.findFirst as any).mockResolvedValue({
        ratePerSqFt: 150,
      });

      (prisma.wallBooking.findMany as any).mockResolvedValue([
        {
          bookingDate: new Date('2026-11-15T00:00:00.000Z'),
          status: 'confirmed',
        },
      ]);

      const res = await request(app).get('/api/wall-bookings/availability');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ratePerSqFt).toBe(150);
      expect(res.body.bookedDates).toContain('2026-11-15');
    });
  });

  describe('Pottery Catalog Endpoints', () => {
    it('should return list of pottery items and glazes', async () => {
      (prisma.potteryItem.findMany as any).mockResolvedValue([
        { id: 'i-01', name: 'Kulhad (clay cup)' },
      ]);
      (prisma.potteryGlaze.findMany as any).mockResolvedValue([
        { id: 'g-01', name: 'Kumkum Red' },
      ]);

      const itemsRes = await request(app).get('/api/pottery/items');
      expect(itemsRes.status).toBe(200);
      expect(itemsRes.body.items).toHaveLength(1);

      const glazesRes = await request(app).get('/api/pottery/glazes');
      expect(glazesRes.status).toBe(200);
      expect(glazesRes.body.glazes).toHaveLength(1);
    });
  });
});
