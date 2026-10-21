import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { prisma } from './prisma';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Trust first proxy (Render / Heroku / AWS ALB reverse proxy)
  app.set('trust proxy', 1);

  // CORS Configuration
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'https://the-living-atelier.vercel.app',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, postman, render health pings)
        if (!origin) return callback(null, true);
        if (
          !config.isProduction ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parser & cookie parser
  app.use(express.json());
  app.use(cookieParser(config.cookieSecret));

  // Top-level Health Check (for Render / cloud ping monitors)
  app.get('/health', async (req, res) => {
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

  // Serve static images (seeded paintings)
  const publicImagesPath = path.resolve(__dirname, '../public/images');
  const seedImagesPath = path.resolve(__dirname, '../../seedData/images');

  if (fs.existsSync(publicImagesPath)) {
    app.use('/images', express.static(publicImagesPath));
  } else if (fs.existsSync(seedImagesPath)) {
    app.use('/images', express.static(seedImagesPath));
  }

  // API Routes
  app.use('/api', apiRouter);

  // 404 Route Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
