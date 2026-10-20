import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaintingService } from '../src/services/paintingService';
import { WallBookingService } from '../src/services/wallBookingService';
import { prisma } from '../src/prisma';
import { AppError } from '../middleware/errorHandler';

vi.mock('../src/prisma', () => ({
  prisma: {
    painting: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    paintingOrder: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wallPaintingRate: {
      findFirst: vi.fn(),
    },
    wallBooking: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prisma);
    }),
  },
}));

describe('Concurrency & Transaction Protection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Painting Purchase Concurrency Protection', () => {
    it('should complete purchase when painting is available', async () => {
      (prisma.painting.findUnique as any).mockResolvedValue({
        id: 'p-001',
        title: 'Peacock Garden',
        price: 6500,
        status: 'available',
      });

      // Atomic update succeeds (count = 1)
      (prisma.painting.updateMany as any).mockResolvedValue({ count: 1 });

      (prisma.paintingOrder.create as any).mockResolvedValue({
        id: 'ord-1',
        customerId: 'cust-1',
        paintingId: 'p-001',
        totalAmount: 6500,
        status: 'placed',
      });

      const order = await PaintingService.purchasePainting('p-001', 'cust-1');
      expect(order).toBeDefined();
      expect(order.status).toBe('placed');
    });

    it('should throw HTTP 409 when painting is already marked sold', async () => {
      (prisma.painting.findUnique as any).mockResolvedValue({
        id: 'p-001',
        title: 'Peacock Garden',
        price: 6500,
        status: 'sold',
      });

      await expect(
        PaintingService.purchasePainting('p-001', 'cust-2')
      ).rejects.toThrowError(/Conflict/);
    });

    it('should throw HTTP 409 when concurrent update race condition is detected (update count is 0)', async () => {
      (prisma.painting.findUnique as any).mockResolvedValue({
        id: 'p-001',
        title: 'Peacock Garden',
        price: 6500,
        status: 'available',
      });

      // Another transaction changed status to 'sold' between findUnique and updateMany
      (prisma.painting.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(
        PaintingService.purchasePainting('p-001', 'cust-2')
      ).rejects.toThrowError(/conflict/i);
    });

    it('should restore painting availability to available when order is cancelled', async () => {
      (prisma.paintingOrder.findUnique as any).mockResolvedValue({
        id: 'ord-1',
        customerId: 'cust-1',
        paintingId: 'p-001',
        status: 'placed',
      });

      (prisma.paintingOrder.update as any).mockResolvedValue({
        id: 'ord-1',
        status: 'cancelled',
      });

      (prisma.painting.update as any).mockResolvedValue({
        id: 'p-001',
        status: 'available',
      });

      const result = await PaintingService.cancelOrder('ord-1', 'cust-1', 'customer');
      expect(result.status).toBe('cancelled');
      expect(prisma.painting.update).toHaveBeenCalledWith({
        where: { id: 'p-001' },
        data: { status: 'available' },
      });
    });

    it('should forbid cancelling an already cancelled order', async () => {
      (prisma.paintingOrder.findUnique as any).mockResolvedValue({
        id: 'ord-1',
        customerId: 'cust-1',
        paintingId: 'p-001',
        status: 'cancelled',
      });

      await expect(
        PaintingService.cancelOrder('ord-1', 'cust-1', 'customer')
      ).rejects.toThrowError(/Only 'placed' orders can be cancelled/);
    });
  });

  describe('Wall Booking Concurrency & Deadline Protection', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    it('should reject booking when date already has an active booking', async () => {
      (prisma.wallPaintingRate.findFirst as any).mockResolvedValue({
        ratePerSqFt: 150,
      });

      (prisma.wallBooking.findFirst as any).mockResolvedValue({
        id: 'wb-existing',
        bookingDate: WallBookingService.normalizeDate(futureDateStr),
        status: 'confirmed',
      });

      await expect(
        WallBookingService.createBooking({
          customerId: 'cust-1',
          bookingDate: futureDateStr,
          wallSizeSqFt: 100,
          serviceAddress: '123 Art Way',
        })
      ).rejects.toThrowError(/already booked or requested/);
    });

    it('should prevent customer from cancelling booking less than 3 days prior', async () => {
      const tightDate = new Date();
      tightDate.setDate(tightDate.getDate() + 2); // only 2 days away!

      (prisma.wallBooking.findUnique as any).mockResolvedValue({
        id: 'wb-tight',
        customerId: 'cust-1',
        bookingDate: tightDate,
        status: 'requested',
      });

      await expect(
        WallBookingService.cancelBooking('wb-tight', 'cust-1', 'customer')
      ).rejects.toThrowError(/up to 3 days before/);
    });

    it('should permit customer to cancel booking 3 or more days prior', async () => {
      const ampleDate = new Date();
      ampleDate.setDate(ampleDate.getDate() + 10); // 10 days away

      (prisma.wallBooking.findUnique as any).mockResolvedValue({
        id: 'wb-ample',
        customerId: 'cust-1',
        bookingDate: ampleDate,
        status: 'requested',
      });

      (prisma.wallBooking.update as any).mockResolvedValue({
        id: 'wb-ample',
        status: 'cancelled',
      });

      const res = await WallBookingService.cancelBooking('wb-ample', 'cust-1', 'customer');
      expect(res.status).toBe('cancelled');
    });
  });
});
