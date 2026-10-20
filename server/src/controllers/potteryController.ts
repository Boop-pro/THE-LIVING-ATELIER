import { Request, Response, NextFunction } from 'express';
import { PotteryService } from '../services/potteryService';
import { createPotteryRequestSchema, updatePotteryRequestSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';

export class PotteryController {
  static async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await PotteryService.getItems();
      res.json({
        success: true,
        items,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGlazes(req: Request, res: Response, next: NextFunction) {
    try {
      const glazes = await PotteryService.getGlazes();
      res.json({
        success: true,
        glazes,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to commission custom pottery.', 401);
      }

      const validated = createPotteryRequestSchema.parse(req.body);
      const request = await PotteryService.createRequest({
        customerId: req.user.id,
        potteryItemId: validated.potteryItemId,
        potteryGlazeId: validated.potteryGlazeId,
        quantity: validated.quantity,
        neededByDate: validated.neededByDate,
        notes: validated.notes,
      });

      res.status(201).json({
        success: true,
        message: 'Custom pottery commission submitted successfully! Our ceramicists will review your request.',
        request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async edit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const { id } = req.params;
      const validated = updatePotteryRequestSchema.parse(req.body);
      const request = await PotteryService.editRequest(
        id,
        req.user.id,
        req.user.role,
        validated
      );

      res.json({
        success: true,
        message: 'Pottery request updated successfully.',
        request,
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
      const request = await PotteryService.cancelRequest(
        id,
        req.user.id,
        req.user.role
      );

      res.json({
        success: true,
        message: 'Pottery request cancelled successfully.',
        request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const request = await PotteryService.acceptRequest(id);

      res.json({
        success: true,
        message: 'Pottery commission accepted. Assigned to studio kiln schedule.',
        request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async decline(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const request = await PotteryService.declineRequest(id);

      res.json({
        success: true,
        message: 'Pottery commission declined.',
        request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerRequests(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const requests = await PotteryService.getCustomerRequests(req.user.id);
      res.json({
        success: true,
        requests,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await PotteryService.getAllRequests();
      res.json({
        success: true,
        requests,
      });
    } catch (error) {
      next(error);
    }
  }
}
