import { z } from 'zod';

// Helper function to calculate calendar days between now (UTC midnight or local midnight) and target date
export function getCalendarDaysDifference(targetDate: Date, fromDate: Date = new Date()): number {
  const d1 = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()));
  const d2 = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Auth Validators
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  // Explicitly prevent role tampering: only 'customer' allowed or omitted
  role: z.literal('customer').optional().default('customer'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Painting Validators
export const createPaintingSchema = z.object({
  id: z.string().min(1, 'Painting ID is required (e.g. p-013)').optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  artist: z.string().min(2, 'Artist name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().positive('Price must be a positive number'),
  imageUrl: z.string().min(1, 'Image URL or path is required'),
  status: z.enum(['available', 'sold']).optional().default('available'),
});

export const updatePaintingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').optional(),
  artist: z.string().min(2, 'Artist name must be at least 2 characters').optional(),
  description: z.string().min(5, 'Description must be at least 5 characters').optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  imageUrl: z.string().min(1, 'Image URL or path is required').optional(),
  status: z.enum(['available', 'sold']).optional(),
});

// Wall Booking Validators
export const createWallBookingSchema = z.object({
  bookingDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, { message: 'Invalid booking date' }).refine((val) => {
    const d = new Date(val);
    const daysDiff = getCalendarDaysDifference(d);
    return daysDiff >= 7 && daysDiff <= 90;
  }, {
    message: 'Booking date must be between 7 and 90 calendar days from today.',
  }),
  wallSizeSqFt: z.number().min(10, 'Wall size must be at least 10 square feet').max(500, 'Wall size cannot exceed 500 square feet'),
  serviceAddress: z.string().min(5, 'Service address must be at least 5 characters long'),
  notes: z.string().optional(),
});

// Pottery Request Validators
export const createPotteryRequestSchema = z.object({
  potteryItemId: z.string().min(1, 'Pottery item selection is required'),
  potteryGlazeId: z.string().min(1, 'Glaze selection is required'),
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').max(12, 'Maximum quantity is 12 pieces'),
  neededByDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, { message: 'Invalid needed-by date' }).refine((val) => {
    const d = new Date(val);
    const daysDiff = getCalendarDaysDifference(d);
    return daysDiff >= 14;
  }, {
    message: 'Needed-by date must be at least 14 calendar days from today.',
  }),
  notes: z.string().optional(),
});

export const updatePotteryRequestSchema = z.object({
  potteryItemId: z.string().min(1, 'Pottery item selection is required').optional(),
  potteryGlazeId: z.string().min(1, 'Glaze selection is required').optional(),
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').max(12, 'Maximum quantity is 12 pieces').optional(),
  neededByDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, { message: 'Invalid needed-by date' }).refine((val) => {
    const d = new Date(val);
    const daysDiff = getCalendarDaysDifference(d);
    return daysDiff >= 14;
  }, {
    message: 'Needed-by date must be at least 14 calendar days from today.',
  }).optional(),
  notes: z.string().optional(),
});
