import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { getCalendarDaysDifference } from '../validators';

export class WallBookingService {
  /**
   * Helper to normalize a date to UTC midnight (YYYY-MM-DDT00:00:00.000Z)
   */
  static normalizeDate(dateInput: string | Date): Date {
    const d = new Date(dateInput);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /**
   * Fetch current active rate per sq ft (seeded at 150)
   */
  static async getActiveRate(): Promise<number> {
    const rateRecord = await prisma.wallPaintingRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return rateRecord ? rateRecord.ratePerSqFt : 150.0;
  }

  /**
   * Fetch all active booked dates (requested or confirmed) for datepicker disablement
   */
  static async getBookedDates() {
    const now = new Date();
    const todayMidnight = this.normalizeDate(now);

    const activeBookings = await prisma.wallBooking.findMany({
      where: {
        status: { in: ['requested', 'confirmed'] },
        bookingDate: { gte: todayMidnight },
      },
      select: {
        bookingDate: true,
        status: true,
      },
    });

    const rate = await this.getActiveRate();

    return {
      ratePerSqFt: rate,
      bookedDates: activeBookings.map((b) => b.bookingDate.toISOString().split('T')[0]),
    };
  }

  /**
   * Create wall booking with date validation, price calculation,
   * active conflict checking, and database partial unique index concurrency protection.
   */
  static async createBooking(data: {
    customerId: string;
    bookingDate: string;
    wallSizeSqFt: number;
    serviceAddress: string;
    notes?: string;
  }) {
    const bookingDateNormalized = this.normalizeDate(data.bookingDate);
    const daysFromNow = getCalendarDaysDifference(bookingDateNormalized);

    // Business rule: Date 7–90 calendar days away
    if (daysFromNow < 7 || daysFromNow > 90) {
      throw new AppError(
        `Wall booking date must be between 7 and 90 calendar days from today. Selected date is ${daysFromNow} days away.`,
        400
      );
    }

    // Business rule: Wall size 10–500 sq ft
    if (data.wallSizeSqFt < 10 || data.wallSizeSqFt > 500) {
      throw new AppError(
        'Wall size must be between 10 and 500 square feet.',
        400
      );
    }

    const ratePerSqFt = await this.getActiveRate();
    const totalPrice = Math.round(data.wallSizeSqFt * ratePerSqFt * 100) / 100;

    return prisma.$transaction(async (tx) => {
      // 1. Transactional check for active booking on the chosen date
      const existingActive = await tx.wallBooking.findFirst({
        where: {
          bookingDate: bookingDateNormalized,
          status: { in: ['requested', 'confirmed'] },
        },
      });

      if (existingActive) {
        throw new AppError(
          'Conflict: This date is already booked or requested by another client. Please select another date.',
          409
        );
      }

      // 2. Insert booking (enforced by DB partial unique index as well)
      try {
        const booking = await tx.wallBooking.create({
          data: {
            customerId: data.customerId,
            bookingDate: bookingDateNormalized,
            wallSizeSqFt: data.wallSizeSqFt,
            ratePerSqFt,
            totalPrice,
            serviceAddress: data.serviceAddress,
            notes: data.notes,
            status: 'requested',
          },
        });
        return booking;
      } catch (err: any) {
        if (err.code === 'P2002' || err.message?.includes('unique_active_wall_booking_date')) {
          throw new AppError(
            'Conflict: This date was just booked by another client. Please choose another date.',
            409
          );
        }
        throw err;
      }
    });
  }

  /**
   * Cancel wall booking:
   * - Only owner can cancel (or studio admin)
   * - Customer can cancel until three days before the booked date
   * - Changes status to 'cancelled', which frees up the date!
   */
  static async cancelBooking(bookingId: string, customerId: string, role: string) {
    const booking = await prisma.wallBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError('Wall booking not found', 404);
    }

    // Ownership check: customer can only access their own booking
    if (role !== 'studio' && booking.customerId !== customerId) {
      throw new AppError('Wall booking not found', 404);
    }

    if (booking.status === 'cancelled' || booking.status === 'declined') {
      throw new AppError(
        `Booking is already ${booking.status}.`,
        400
      );
    }

    // Cancellation deadline check:
    // "Customer can cancel until three days before the booked date."
    const daysUntilBooking = getCalendarDaysDifference(booking.bookingDate);
    if (role !== 'studio' && daysUntilBooking < 3) {
      throw new AppError(
        `Wall bookings can only be cancelled up to 3 days before the scheduled date. This booking is ${daysUntilBooking} day(s) away.`,
        400
      );
    }

    const updated = await prisma.wallBooking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    return updated;
  }

  /**
   * Admin confirm booking:
   * - Only requested bookings can be confirmed
   */
  static async confirmBooking(bookingId: string) {
    const booking = await prisma.wallBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError('Wall booking not found', 404);
    }

    if (booking.status !== 'requested') {
      throw new AppError(
        `Cannot confirm booking with status '${booking.status}'. Only 'requested' bookings can be confirmed.`,
        400
      );
    }

    return prisma.wallBooking.update({
      where: { id: bookingId },
      data: { status: 'confirmed' },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Admin decline booking:
   * - Only requested bookings can be declined
   * - Frees up the date for new bookings!
   */
  static async declineBooking(bookingId: string) {
    const booking = await prisma.wallBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError('Wall booking not found', 404);
    }

    if (booking.status !== 'requested') {
      throw new AppError(
        `Cannot decline booking with status '${booking.status}'. Only 'requested' bookings can be declined.`,
        400
      );
    }

    return prisma.wallBooking.update({
      where: { id: bookingId },
      data: { status: 'declined' },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async getCustomerBookings(customerId: string) {
    return prisma.wallBooking.findMany({
      where: { customerId },
      orderBy: { bookingDate: 'asc' },
    });
  }

  static async getAllBookings() {
    return prisma.wallBooking.findMany({
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { bookingDate: 'asc' },
    });
  }
}
