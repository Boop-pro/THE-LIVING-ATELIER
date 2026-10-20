import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma';
import { AppError } from './errorHandler';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'studio';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Check HTTP-only cookie
    if (req.cookies && (req.cookies.atelier_jwt || req.cookies.token)) {
      token = req.cookies.atelier_jwt || req.cookies.token;
    }
    // Check Authorization header fallback
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err: any) {
      return next(new AppError('Invalid or expired authentication session. Please log in again.', 401));
    }

    if (!decoded || !decoded.userId) {
      return next(new AppError('Invalid authentication token payload.', 401));
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return next(new AppError('User account associated with this session no longer exists.', 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'customer' | 'studio',
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...allowedRoles: ('customer' | 'studio')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Access restricted. You do not have permissions for this action.`,
          403
        )
      );
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.cookies && (req.cookies.atelier_jwt || req.cookies.token)) {
      token = req.cookies.atelier_jwt || req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded: any = jwt.verify(token, config.jwtSecret);
        if (decoded && decoded.userId) {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, role: true },
          });
          if (user) {
            req.user = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role as 'customer' | 'studio',
            };
          }
        }
      } catch {
        // Silently continue for optionalAuth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
