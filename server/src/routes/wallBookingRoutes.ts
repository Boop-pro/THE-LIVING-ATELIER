import { Router } from 'express';
import { WallBookingController } from '../controllers/wallBookingController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public availability check
router.get('/availability', WallBookingController.getAvailability);

// Customer booking creation & personal listing
router.post('/', authenticate, requireRole('customer'), WallBookingController.create);
router.get('/my', authenticate, requireRole('customer'), WallBookingController.getCustomerBookings);
router.post('/:id/cancel', authenticate, WallBookingController.cancel);

// Studio admin actions
router.get('/all', authenticate, requireRole('studio'), WallBookingController.getAllBookings);
router.patch('/:id/confirm', authenticate, requireRole('studio'), WallBookingController.confirm);
router.patch('/:id/decline', authenticate, requireRole('studio'), WallBookingController.decline);

export default router;
