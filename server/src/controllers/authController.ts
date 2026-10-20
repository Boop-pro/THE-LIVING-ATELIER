import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { registerSchema, loginSchema } from '../validators';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: (config.isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email.toLowerCase() },
      });

      if (existingUser) {
        throw new AppError('An account with this email address already exists.', 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, 10);

      // Create user - strictly 'customer' role
      const user = await prisma.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          passwordHash,
          name: validatedData.name,
          role: 'customer',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      // Set HTTP-only cookie
      res.cookie('atelier_jwt', token, getCookieOptions());

      res.status(201).json({
        success: true,
        message: 'Account created successfully! Welcome to The Living Atelier.',
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: validatedData.email.toLowerCase() },
      });

      if (!user) {
        throw new AppError('Invalid email or password credentials.', 401);
      }

      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password credentials.', 401);
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      res.cookie('atelier_jwt', token, getCookieOptions());

      res.json({
        success: true,
        message: 'Login successful.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('atelier_jwt', {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: (config.isProduction ? 'none' : 'lax') as 'none' | 'lax',
      });

      res.json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}
