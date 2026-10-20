import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { getCalendarDaysDifference } from '../validators';

export class PotteryService {
  /**
   * Get all seeded pottery items
   */
  static async getItems() {
    return prisma.potteryItem.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Get all seeded glazes
   */
  static async getGlazes() {
    return prisma.potteryGlaze.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Create custom pottery commission request
   */
  static async createRequest(data: {
    customerId: string;
    potteryItemId: string;
    potteryGlazeId: string;
    quantity: number;
    neededByDate: string;
    notes?: string;
  }) {
    // 1. Verify pottery item exists
    const item = await prisma.potteryItem.findUnique({
      where: { id: data.potteryItemId },
    });
    if (!item) {
      throw new AppError('Invalid pottery item selected.', 400);
    }

    // 2. Verify glaze exists
    const glaze = await prisma.potteryGlaze.findUnique({
      where: { id: data.potteryGlazeId },
    });
    if (!glaze) {
      throw new AppError('Invalid pottery glaze selected.', 400);
    }

    // 3. Verify quantity 1–12
    if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 12) {
      throw new AppError('Quantity must be an integer between 1 and 12 pieces.', 400);
    }

    // 4. Verify needed-by date >= 14 calendar days away
    const neededDate = new Date(data.neededByDate);
    const normalizedNeededDate = new Date(Date.UTC(neededDate.getUTCFullYear(), neededDate.getUTCMonth(), neededDate.getUTCDate()));
    const daysDiff = getCalendarDaysDifference(normalizedNeededDate);

    if (daysDiff < 14) {
      throw new AppError(
        `Needed-by date must be at least 14 calendar days from today for hand-throwing and kiln firing. Selected date is ${daysDiff} days away.`,
        400
      );
    }

    return prisma.potteryRequest.create({
      data: {
        customerId: data.customerId,
        potteryItemId: data.potteryItemId,
        potteryGlazeId: data.potteryGlazeId,
        quantity: data.quantity,
        neededByDate: normalizedNeededDate,
        notes: data.notes,
        status: 'requested',
      },
      include: {
        item: true,
        glaze: true,
      },
    });
  }

  /**
   * Customer edit pottery request:
   * - Only while status is 'requested'
   * - Validates ownership
   */
  static async editRequest(
    requestId: string,
    customerId: string,
    role: string,
    data: {
      potteryItemId?: string;
      potteryGlazeId?: string;
      quantity?: number;
      neededByDate?: string;
      notes?: string;
    }
  ) {
    const existing = await prisma.potteryRequest.findUnique({
      where: { id: requestId },
      include: { item: true, glaze: true },
    });

    if (!existing) {
      throw new AppError('Pottery request not found.', 404);
    }

    // Ownership check
    if (role !== 'studio' && existing.customerId !== customerId) {
      throw new AppError('Pottery request not found.', 404);
    }

    // Business rule: Customer may edit only while status is 'requested'
    if (existing.status !== 'requested') {
      throw new AppError(
        `Cannot edit pottery request with status '${existing.status}'. Only requests with 'requested' status can be edited.`,
        400
      );
    }

    // If item changing, verify
    if (data.potteryItemId) {
      const item = await prisma.potteryItem.findUnique({ where: { id: data.potteryItemId } });
      if (!item) throw new AppError('Invalid pottery item selected.', 400);
    }

    // If glaze changing, verify
    if (data.potteryGlazeId) {
      const glaze = await prisma.potteryGlaze.findUnique({ where: { id: data.potteryGlazeId } });
      if (!glaze) throw new AppError('Invalid pottery glaze selected.', 400);
    }

    // If quantity changing, verify 1-12
    if (data.quantity !== undefined) {
      if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 12) {
        throw new AppError('Quantity must be an integer between 1 and 12 pieces.', 400);
      }
    }

    // If neededByDate changing, verify >= 14 days
    let normalizedNeededDate: Date | undefined;
    if (data.neededByDate) {
      const d = new Date(data.neededByDate);
      normalizedNeededDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const daysDiff = getCalendarDaysDifference(normalizedNeededDate);
      if (daysDiff < 14) {
        throw new AppError(
          `Needed-by date must be at least 14 calendar days from today. Selected date is ${daysDiff} days away.`,
          400
        );
      }
    }

    return prisma.potteryRequest.update({
      where: { id: requestId },
      data: {
        potteryItemId: data.potteryItemId,
        potteryGlazeId: data.potteryGlazeId,
        quantity: data.quantity,
        neededByDate: normalizedNeededDate,
        notes: data.notes,
      },
      include: {
        item: true,
        glaze: true,
      },
    });
  }

  /**
   * Cancel pottery request:
   * - Customer may cancel only while status is 'requested'
   */
  static async cancelRequest(requestId: string, customerId: string, role: string) {
    const existing = await prisma.potteryRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new AppError('Pottery request not found.', 404);
    }

    if (role !== 'studio' && existing.customerId !== customerId) {
      throw new AppError('Pottery request not found.', 404);
    }

    if (existing.status !== 'requested') {
      throw new AppError(
        `Cannot cancel pottery request with status '${existing.status}'. Only requests with 'requested' status can be cancelled.`,
        400
      );
    }

    return prisma.potteryRequest.update({
      where: { id: requestId },
      data: { status: 'cancelled' },
      include: {
        item: true,
        glaze: true,
      },
    });
  }

  /**
   * Admin accept pottery request
   */
  static async acceptRequest(requestId: string) {
    const existing = await prisma.potteryRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new AppError('Pottery request not found.', 404);
    }

    if (existing.status !== 'requested') {
      throw new AppError(
        `Cannot accept request with status '${existing.status}'. Only 'requested' requests can be accepted.`,
        400
      );
    }

    return prisma.potteryRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
      include: {
        item: true,
        glaze: true,
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Admin decline pottery request
   */
  static async declineRequest(requestId: string) {
    const existing = await prisma.potteryRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new AppError('Pottery request not found.', 404);
    }

    if (existing.status !== 'requested') {
      throw new AppError(
        `Cannot decline request with status '${existing.status}'. Only 'requested' requests can be declined.`,
        400
      );
    }

    return prisma.potteryRequest.update({
      where: { id: requestId },
      data: { status: 'declined' },
      include: {
        item: true,
        glaze: true,
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async getCustomerRequests(customerId: string) {
    return prisma.potteryRequest.findMany({
      where: { customerId },
      include: {
        item: true,
        glaze: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAllRequests() {
    return prisma.potteryRequest.findMany({
      include: {
        item: true,
        glaze: true,
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
