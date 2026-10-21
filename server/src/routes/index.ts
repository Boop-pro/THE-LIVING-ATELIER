import { Router } from 'express';
import authRoutes from './authRoutes';
import paintingRoutes from './paintingRoutes';
import wallBookingRoutes from './wallBookingRoutes';
import potteryRoutes from './potteryRoutes';

import { prisma } from '../prisma';
import { config } from '../config';

const router = Router();

// Health Check
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError: string | null = null;
  try {
    if (!process.env.DATABASE_URL && !config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not configured');
    }
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbError = err.message || 'Database connection error';
  }

  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    app: 'The Living Atelier API',
    database: dbStatus,
    databaseConfigured: !!(process.env.DATABASE_URL || config.databaseUrl),
    ...(dbError ? { error: dbError } : {}),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/paintings', paintingRoutes);
router.use('/wall-bookings', wallBookingRoutes);
router.use('/pottery', potteryRoutes);

export default router;
