import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class PaintingService {
  static async getAllPaintings() {
    return prisma.painting.findMany({
      orderBy: { id: 'asc' },
    });
  }

  static async getPaintingById(id: string) {
    const painting = await prisma.painting.findUnique({
      where: { id },
    });
    if (!painting) {
      throw new AppError('Painting not found', 404);
    }
    return painting;
  }

  static async createPainting(data: {
    id?: string;
    title: string;
    artist: string;
    description: string;
    price: number;
    imageUrl: string;
    status?: 'available' | 'sold';
  }) {
    let paintingId = data.id;
    if (!paintingId) {
      // Generate next id like p-013
      const count = await prisma.painting.count();
      paintingId = `p-${String(count + 1).padStart(3, '0')}`;
    }

    return prisma.painting.create({
      data: {
        id: paintingId,
        title: data.title,
        artist: data.artist,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        status: data.status || 'available',
      },
    });
  }

  static async updatePainting(
    id: string,
    data: {
      title?: string;
      artist?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      status?: 'available' | 'sold';
    }
  ) {
    const existing = await prisma.painting.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Painting not found', 404);
    }

    if (existing.status === 'sold') {
      throw new AppError(
        'Cannot edit a sold painting. Artwork details are permanently preserved in the atelier registry.',
        400
      );
    }

    return prisma.painting.update({
      where: { id },
      data,
    });
  }

  /**
   * Concurrency-safe atomic painting purchase.
   * Uses conditional update inside a database transaction to prevent double-purchase races.
   */
  static async purchasePainting(paintingId: string, customerId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Check if painting exists and is currently available
      const painting = await tx.painting.findUnique({
        where: { id: paintingId },
      });

      if (!painting) {
        throw new AppError('Painting not found', 404);
      }

      if (painting.status === 'sold') {
        throw new AppError(
          'Conflict: This one-of-a-kind painting has already been purchased and is no longer available.',
          409
        );
      }

      // 2. Atomic conditional update: only update if status is still 'available'
      const updateResult = await tx.painting.updateMany({
        where: {
          id: paintingId,
          status: 'available',
        },
        data: {
          status: 'sold',
        },
      });

      // If count is 0, a concurrent transaction grabbed it first
      if (updateResult.count === 0) {
        throw new AppError(
          'Conflict: Painting purchase conflict. The artwork was just acquired by another collector.',
          409
        );
      }

      // 3. Create the order with 'placed' status
      const order = await tx.paintingOrder.create({
        data: {
          customerId,
          paintingId,
          totalAmount: painting.price,
          status: 'placed',
        },
        include: {
          painting: true,
        },
      });

      return order;
    });
  }

  /**
   * Cancel painting order:
   * - Only owner can cancel (or studio admin)
   * - Only 'placed' orders can be cancelled
   * - Atomically marks order 'cancelled' and restores painting status to 'available'
   */
  static async cancelOrder(orderId: string, customerId: string, role: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.paintingOrder.findUnique({
        where: { id: orderId },
        include: { painting: true },
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Ownership check: customer can only access their own order
      if (role !== 'studio' && order.customerId !== customerId) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'placed') {
        throw new AppError(
          `Cannot cancel order with status '${order.status}'. Only 'placed' orders can be cancelled.`,
          400
        );
      }

      // 1. Mark order cancelled
      const updatedOrder = await tx.paintingOrder.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
        include: { painting: true },
      });

      // 2. Restore painting availability
      await tx.painting.update({
        where: { id: order.paintingId },
        data: { status: 'available' },
      });

      return updatedOrder;
    });
  }

  static async getCustomerOrders(customerId: string) {
    return prisma.paintingOrder.findMany({
      where: { customerId },
      include: { painting: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAllOrders() {
    return prisma.paintingOrder.findMany({
      include: {
        painting: true,
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
