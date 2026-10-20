import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

describe('Live Neon PostgreSQL End-to-End Workflows', () => {
  const app = createApp();

  const testCustomerEmail = `evaluator.patron.${Date.now()}@example.com`;
  const testPassword = 'PatronPassword123';
  let customerToken: string = '';
  let customerId: string = '';
  let studioToken: string = '';

  // Calculate future dates
  const futureWallDate = new Date();
  futureWallDate.setDate(futureWallDate.getDate() + 25);
  const futureWallDateStr = futureWallDate.toISOString().split('T')[0];

  const futurePotteryDate = new Date();
  futurePotteryDate.setDate(futurePotteryDate.getDate() + 21);
  const futurePotteryDateStr = futurePotteryDate.toISOString().split('T')[0];

  let testOrderId: string = '';
  let testBookingId: string = '';
  let testPotteryRequestId: string = '';

  beforeAll(async () => {
    // 0. Ensure Neon database connection is warmed up
    let connected = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        connected = true;
        break;
      } catch (err) {
        if (attempt === 4) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    expect(connected).toBe(true);

    // 1. Studio Admin Login
    const adminPassword = process.env.ADMIN_PASSWORD || 'Studio@123';
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'studio@artstudio.in', password: adminPassword });
    expect(adminLoginRes.status).toBe(200);
    studioToken = adminLoginRes.body.token;

    // 2. Register Test Customer
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Evaluation Patron',
        email: testCustomerEmail,
        password: testPassword,
      });
    expect(registerRes.status).toBe(201);
    customerToken = registerRes.body.token;
    customerId = registerRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    try {
      if (testOrderId) {
        await prisma.paintingOrder.deleteMany({ where: { id: testOrderId } });
      }
      if (testBookingId) {
        await prisma.wallBooking.deleteMany({ where: { id: testBookingId } });
      }
      if (testPotteryRequestId) {
        await prisma.potteryRequest.deleteMany({ where: { id: testPotteryRequestId } });
      }
      if (customerId) {
        await prisma.user.deleteMany({ where: { id: customerId } });
      }
      // Ensure p-002 is restored to available
      await prisma.painting.update({
        where: { id: 'p-002' },
        data: { status: 'available' },
      });
    } catch (e) {
      console.warn('Cleanup notice:', e);
    } finally {
      await prisma.$disconnect();
    }
  });

  describe('Workflow A: Real Painting Purchase & Cancellation on Neon', () => {
    it('1. Fetches paintings catalog from live Neon database', async () => {
      const res = await request(app).get('/api/paintings');
      expect(res.status).toBe(200);
      expect(res.body.paintings.length).toBeGreaterThanOrEqual(12);
      const p002 = res.body.paintings.find((p: any) => p.id === 'p-002');
      expect(p002).toBeDefined();
      expect(p002.status).toBe('available');
    });

    it('2. Authenticated customer purchases available painting p-002 atomically', async () => {
      const res = await request(app)
        .post('/api/paintings/p-002/purchase')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('placed');
      expect(res.body.order.totalAmount).toBe(1800);
      testOrderId = res.body.order.id;

      // Verify in DB that painting status changed to sold
      const updatedPainting = await prisma.painting.findUnique({ where: { id: 'p-002' } });
      expect(updatedPainting?.status).toBe('sold');
    });

    it('3. Duplicate purchase of p-002 is rejected with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/paintings/p-002/purchase')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Conflict');
    });

    it('4. Customer cancels placed order, atomically restoring painting availability', async () => {
      const res = await request(app)
        .post(`/api/paintings/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe('cancelled');

      // Verify painting status is restored to available in Neon DB
      const restored = await prisma.painting.findUnique({ where: { id: 'p-002' } });
      expect(restored?.status).toBe('available');
    });

    it('5. Admin cannot edit a sold painting (p-004)', async () => {
      const res = await request(app)
        .put('/api/paintings/p-004')
        .set('Authorization', `Bearer ${studioToken}`)
        .send({ price: 15000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot edit a sold painting');
    });
  });

  describe('Workflow B: Real Wall Booking & Duplicate Date Rejection on Neon', () => {
    it('1. Customer creates a valid wall booking on Neon DB', async () => {
      const res = await request(app)
        .post('/api/wall-bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingDate: futureWallDateStr,
          wallSizeSqFt: 100,
          serviceAddress: 'Road 36, Jubilee Hills, Hyderabad',
          notes: 'Living room feature wall',
        });

      expect(res.status).toBe(201);
      expect(res.body.booking.status).toBe('requested');
      expect(res.body.booking.ratePerSqFt).toBe(150);
      expect(res.body.booking.totalPrice).toBe(15000);
      testBookingId = res.body.booking.id;
    });

    it('2. Simultaneous/duplicate booking for the same date is rejected with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/wall-bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingDate: futureWallDateStr,
          wallSizeSqFt: 150,
          serviceAddress: 'Another Street, Banjara Hills',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Conflict');
    });

    it('3. Studio Admin confirms the requested booking', async () => {
      const res = await request(app)
        .patch(`/api/wall-bookings/${testBookingId}/confirm`)
        .set('Authorization', `Bearer ${studioToken}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('confirmed');
    });

    it('4. Customer cancels booking (>= 3 days away), releasing the calendar date', async () => {
      const res = await request(app)
        .post(`/api/wall-bookings/${testBookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('cancelled');

      // Check that the date is now free to be re-booked!
      const rebookRes = await request(app)
        .post('/api/wall-bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingDate: futureWallDateStr,
          wallSizeSqFt: 50,
          serviceAddress: 'Road 36, Jubilee Hills, Hyderabad',
        });

      expect(rebookRes.status).toBe(201);
      // Clean up the re-booked test record
      await prisma.wallBooking.deleteMany({ where: { id: rebookRes.body.booking.id } });
    });

    it('5. Wall booking rejects invalid dates (<7 or >90 days) and wall sizes (<10 or >500)', async () => {
      // Too soon (2 days)
      const tooSoon = new Date();
      tooSoon.setDate(tooSoon.getDate() + 2);
      const res1 = await request(app)
        .post('/api/wall-bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingDate: tooSoon.toISOString().split('T')[0],
          wallSizeSqFt: 50,
          serviceAddress: 'Address',
        });
      expect(res1.status).toBe(400);

      // Too small wall size (5 sq.ft)
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 15);
      const res2 = await request(app)
        .post('/api/wall-bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingDate: validDate.toISOString().split('T')[0],
          wallSizeSqFt: 5,
          serviceAddress: 'Address',
        });
      expect(res2.status).toBe(400);
    });
  });

  describe('Workflow C: Real Pottery Commission Lifecycle on Neon', () => {
    it('1. Customer submits custom pottery request (Kulhad + Kumkum Red, qty 4)', async () => {
      const res = await request(app)
        .post('/api/pottery')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          potteryItemId: 'i-01',
          potteryGlazeId: 'g-01',
          quantity: 4,
          neededByDate: futurePotteryDateStr,
          notes: 'Special studio inscription on base',
        });

      expect(res.status).toBe(201);
      expect(res.body.request.status).toBe('requested');
      expect(res.body.request.quantity).toBe(4);
      testPotteryRequestId = res.body.request.id;
    });

    it('2. Customer successfully edits request while in requested status', async () => {
      const res = await request(app)
        .put(`/api/pottery/${testPotteryRequestId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          quantity: 8,
          notes: 'Updated to 8 pieces',
        });

      expect(res.status).toBe(200);
      expect(res.body.request.quantity).toBe(8);
      expect(res.body.request.notes).toBe('Updated to 8 pieces');
    });

    it('3. Studio Admin accepts pottery commission', async () => {
      const res = await request(app)
        .patch(`/api/pottery/${testPotteryRequestId}/accept`)
        .set('Authorization', `Bearer ${studioToken}`);

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe('accepted');
    });

    it('4. Customer edit after acceptance is rejected with HTTP 400', async () => {
      const res = await request(app)
        .put(`/api/pottery/${testPotteryRequestId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 10 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only requests with \'requested\' status can be edited');
    });

    it('5. Customer cannot cancel an accepted pottery commission', async () => {
      const res = await request(app)
        .post(`/api/pottery/${testPotteryRequestId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot cancel pottery request with status');
    });

    it('6. Admin decline functionality on a separate pottery request', async () => {
      // Create request 2
      const createRes = await request(app)
        .post('/api/pottery')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          potteryItemId: 'i-02',
          potteryGlazeId: 'g-02',
          quantity: 2,
          neededByDate: futurePotteryDateStr,
        });
      expect(createRes.status).toBe(201);
      const req2Id = createRes.body.request.id;

      // Admin declines
      const declineRes = await request(app)
        .patch(`/api/pottery/${req2Id}/decline`)
        .set('Authorization', `Bearer ${studioToken}`);

      expect(declineRes.status).toBe(200);
      expect(declineRes.body.request.status).toBe('declined');

      // Cleanup req2
      await prisma.potteryRequest.deleteMany({ where: { id: req2Id } });
    });

    it('7. Pottery request rejects invalid quantities and dates', async () => {
      // Invalid quantity (15 > 12)
      const res1 = await request(app)
        .post('/api/pottery')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          potteryItemId: 'i-01',
          potteryGlazeId: 'g-01',
          quantity: 15,
          neededByDate: futurePotteryDateStr,
        });
      expect(res1.status).toBe(400);

      // Invalid date (< 14 days)
      const soon = new Date();
      soon.setDate(soon.getDate() + 5);
      const res2 = await request(app)
        .post('/api/pottery')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          potteryItemId: 'i-01',
          potteryGlazeId: 'g-01',
          quantity: 3,
          neededByDate: soon.toISOString().split('T')[0],
        });
      expect(res2.status).toBe(400);
    });
  });

  describe('Workflow D: Customer Ownership & Cross-User Security', () => {
    let secondCustomerToken: string = '';
    let secondCustomerId: string = '';

    beforeAll(async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second Patron',
          email: `second.patron.${Date.now()}@example.com`,
          password: 'Password123',
        });
      expect(regRes.status).toBe(201);
      secondCustomerToken = regRes.body.token;
      secondCustomerId = regRes.body.user.id;
    });

    afterAll(async () => {
      if (secondCustomerId) {
        await prisma.user.deleteMany({ where: { id: secondCustomerId } });
      }
    });

    it('1. Second customer cannot view or cancel first customer orders', async () => {
      const res = await request(app)
        .post(`/api/paintings/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${secondCustomerToken}`);

      expect(res.status).toBe(404);
    });

    it('2. Second customer cannot cancel first customer wall bookings', async () => {
      const res = await request(app)
        .post(`/api/wall-bookings/${testBookingId}/cancel`)
        .set('Authorization', `Bearer ${secondCustomerToken}`);

      expect(res.status).toBe(404);
    });

    it('3. Second customer cannot edit or cancel first customer pottery requests', async () => {
      const res = await request(app)
        .put(`/api/pottery/${testPotteryRequestId}`)
        .set('Authorization', `Bearer ${secondCustomerToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(404);
    });
  });
});
