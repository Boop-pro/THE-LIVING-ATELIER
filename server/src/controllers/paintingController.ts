import { Request, Response, NextFunction } from 'express';
import { PaintingService } from '../services/paintingService';
import { createPaintingSchema, updatePaintingSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';

export class PaintingController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const paintings = await PaintingService.getAllPaintings();
      res.json({
        success: true,
        paintings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const painting = await PaintingService.getPaintingById(req.params.id);
      res.json({
        success: true,
        painting,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createPaintingSchema.parse(req.body);
      const painting = await PaintingService.createPainting(validated);
      res.status(201).json({
        success: true,
        message: 'Painting created successfully.',
        painting,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updatePaintingSchema.parse(req.body);
      const painting = await PaintingService.updatePainting(req.params.id, validated);
      res.json({
        success: true,
        message: 'Painting updated successfully.',
        painting,
      });
    } catch (error) {
      next(error);
    }
  }

  static async purchase(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to purchase artworks.', 401);
      }

      const { id } = req.params;
      const order = await PaintingService.purchasePainting(id, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Congratulations! Your purchase has been confirmed.',
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const { orderId } = req.params;
      const order = await PaintingService.cancelOrder(orderId, req.user.id, req.user.role);

      res.json({
        success: true,
        message: 'Order cancelled successfully and artwork availability restored.',
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const orders = await PaintingService.getCustomerOrders(req.user.id);
      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await PaintingService.getAllOrders();
      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      next(error);
    }
  }
}
