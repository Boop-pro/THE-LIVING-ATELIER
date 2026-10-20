import { Router } from 'express';
import authRoutes from './authRoutes';
import paintingRoutes from './paintingRoutes';
import wallBookingRoutes from './wallBookingRoutes';
import potteryRoutes from './potteryRoutes';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'The Living Atelier API',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/paintings', paintingRoutes);
router.use('/wall-bookings', wallBookingRoutes);
router.use('/pottery', potteryRoutes);

export default router;
