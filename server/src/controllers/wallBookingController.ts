import { Request, Response, NextFunction } from 'express';
import { WallBookingService } from '../services/wallBookingService';
import { createWallBookingSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';

export class WallBookingController {
  static async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await WallBookingService.getBookedDates();
      res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to book wall painting services.', 401);
      }

      const validated = createWallBookingSchema.parse(req.body);
      const booking = await WallBookingService.createBooking({
        customerId: req.user.id,
        bookingDate: validated.bookingDate,
        wallSizeSqFt: validated.wallSizeSqFt,
        serviceAddress: validated.serviceAddress,
        notes: validated.notes,
      });

      res.status(201).json({
        success: true,
        message: 'Wall painting request submitted successfully! Our studio team will review your booking.',
        booking,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const { id } = req.params;
      const booking = await WallBookingService.cancelBooking(id, req.user.id, req.user.role);

      res.json({
        success: true,
        message: 'Wall booking cancelled successfully.',
        booking,
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await WallBookingService.confirmBooking(id);

      res.json({
        success: true,
        message: 'Wall booking confirmed successfully.',
        booking,
      });
    } catch (error) {
      next(error);
    }
  }

  static async decline(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await WallBookingService.declineBooking(id);

      res.json({
        success: true,
        message: 'Wall booking declined. The calendar date has been released.',
        booking,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerBookings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const bookings = await WallBookingService.getCustomerBookings(req.user.id);
      res.json({
        success: true,
        bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await WallBookingService.getAllBookings();
      res.json({
        success: true,
        bookings,
      });
    } catch (error) {
      next(error);
    }
  }
}
