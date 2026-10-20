import { Router } from 'express';
import { PotteryController } from '../controllers/potteryController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public options
router.get('/items', PotteryController.getItems);
router.get('/glazes', PotteryController.getGlazes);

// Customer commissions & management
router.post('/', authenticate, requireRole('customer'), PotteryController.create);
router.get('/my', authenticate, requireRole('customer'), PotteryController.getCustomerRequests);
router.put('/:id', authenticate, requireRole('customer'), PotteryController.edit);
router.post('/:id/cancel', authenticate, PotteryController.cancel);

// Studio admin actions
router.get('/all', authenticate, requireRole('studio'), PotteryController.getAllRequests);
router.patch('/:id/accept', authenticate, requireRole('studio'), PotteryController.accept);
router.patch('/:id/decline', authenticate, requireRole('studio'), PotteryController.decline);

export default router;
