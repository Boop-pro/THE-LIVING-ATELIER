import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

describe('True PostgreSQL Concurrency & Race Condition Tests', () => {
  const app = createApp();

  const racePaintingId = `p-race-${Date.now()}`;
  const futureDateObj = new Date();
  futureDateObj.setDate(futureDateObj.getDate() + 30 + Math.floor(Math.random() * 30));
  const raceBookingDate = futureDateObj.toISOString().split('T')[0];
  const customerIds: string[] = [];
  const customerTokens: string[] = [];
  const createdBookingIds: string[] = [];

  beforeAll(async () => {
    // 0. Ensure Neon database connection is warmed up
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        break;
      } catch (err) {
        if (attempt === 4) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 1. Create 5 test patrons in PostgreSQL
    for (let i = 1; i <= 5; i++) {
      const email = `concurrent.patron.${i}.${Date.now()}@test.atelier.in`;
      const user = await prisma.user.create({
        data: {
          email,
          name: `Concurrent Patron ${i}`,
          passwordHash: 'dummyhash',
          role: 'customer',
        },
      });
      customerIds.push(user.id);

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret
      );
      customerTokens.push(token);
    }

    // 2. Create an isolated one-of-a-kind painting in PostgreSQL
    await prisma.painting.create({
      data: {
        id: racePaintingId,
        title: 'Concurrent Race Artwork: Forest Diptych',
        artist: 'Master Test Artist',
        description: 'Test painting used to verify atomic concurrency protection.',
        price: 9999,
        imageUrl: 'images/p-001.jpg',
        status: 'available',
      },
    });
  });

  afterAll(async () => {
    // Clean up all created test records
    try {
      await prisma.paintingOrder.deleteMany({ where: { paintingId: racePaintingId } });
      await prisma.painting.deleteMany({ where: { id: racePaintingId } });
      await prisma.wallBooking.deleteMany({
        where: { bookingDate: new Date(`${raceBookingDate}T00:00:00.000Z`) },
      });
      if (customerIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: customerIds } } });
      }
    } catch (e) {
      console.warn('Concurrency cleanup notice:', e);
    }
  });

  it('1. True Concurrent Painting Purchase: Exactly 1 of 5 simultaneous purchases succeeds, 4 receive HTTP 409 Conflict', async () => {
    // Fire 5 purchase calls simultaneously in parallel
    const purchasePromises = customerTokens.map((token) =>
      request(app)
        .post(`/api/paintings/${racePaintingId}/purchase`)
        .set('Authorization', `Bearer ${token}`)
    );

    const results = await Promise.all(purchasePromises);

    const successfulPurchases = results.filter((res) => res.status === 201);
    const conflictedPurchases = results.filter((res) => res.status === 409);

    // Exactly 1 winner
    expect(successfulPurchases.length).toBe(1);
    // Exactly 4 conflicts
    expect(conflictedPurchases.length).toBe(4);

    const winner = successfulPurchases[0].body;
    expect(winner.success).toBe(true);
    expect(winner.order.paintingId).toBe(racePaintingId);

    // Verify all 4 conflicting responses returned descriptive 409 message
    conflictedPurchases.forEach((res) => {
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Conflict/i);
    });

    // Verify database state directly: painting status must be 'sold'
    const finalPainting = await prisma.painting.findUnique({
      where: { id: racePaintingId },
      include: { orders: true },
    });
    expect(finalPainting?.status).toBe('sold');
    // Exactly 1 order in the database
    expect(finalPainting?.orders.length).toBe(1);
  });

  it('2. True Concurrent Wall Booking: Exactly 1 of 5 simultaneous bookings for the same date succeeds, 4 receive HTTP 409 Conflict', async () => {
    // Fire 5 booking calls simultaneously in parallel for the exact same date
    const bookingPromises = customerTokens.map((token, index) =>
      request(app)
        .post('/api/wall-bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingDate: raceBookingDate,
          wallSizeSqFt: 50 + index * 10,
          serviceAddress: `Concurrent Address ${index + 1}, Jubilee Hills`,
        })
    );

    const results = await Promise.all(bookingPromises);

    const successfulBookings = results.filter((res) => res.status === 201);
    const conflictedBookings = results.filter((res) => res.status === 409);

    // Exactly 1 booking succeeds
    expect(successfulBookings.length).toBe(1);
    // Exactly 4 are rejected by the partial unique index
    expect(conflictedBookings.length).toBe(4);

    const winningBooking = successfulBookings[0].body.booking;
    createdBookingIds.push(winningBooking.id);

    // Verify all 4 conflicting responses returned HTTP 409 Conflict
    conflictedBookings.forEach((res) => {
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Conflict/i);
    });

    // Verify database state directly in PostgreSQL: exactly 1 active booking exists for that date
    const activeBookingsInDb = await prisma.wallBooking.findMany({
      where: {
        bookingDate: new Date(`${raceBookingDate}T00:00:00.000Z`),
        status: { in: ['requested', 'confirmed'] },
      },
    });
    expect(activeBookingsInDb.length).toBe(1);
  });
});
