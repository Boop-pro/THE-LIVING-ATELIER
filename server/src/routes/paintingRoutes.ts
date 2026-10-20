import { Router } from 'express';
import { PaintingController } from '../controllers/paintingController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public catalog
router.get('/', PaintingController.getAll);
router.get('/:id', PaintingController.getById);

// Admin painting inventory management
router.post('/', authenticate, requireRole('studio'), PaintingController.create);
router.put('/:id', authenticate, requireRole('studio'), PaintingController.update);

// Customer purchases
router.post('/:id/purchase', authenticate, requireRole('customer'), PaintingController.purchase);

// Order management
router.get('/orders/my', authenticate, requireRole('customer'), PaintingController.getCustomerOrders);
router.get('/orders/all', authenticate, requireRole('studio'), PaintingController.getAllOrders);
router.post('/orders/:orderId/cancel', authenticate, PaintingController.cancelOrder);

export default router;
