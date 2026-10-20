export type Role = 'customer' | 'studio';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export type PaintingStatus = 'available' | 'sold';

export interface Painting {
  id: string;
  title: string;
  artist: string;
  description: string;
  price: number;
  imageUrl: string;
  status: PaintingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 'placed' | 'cancelled';

export interface PaintingOrder {
  id: string;
  customerId: string;
  paintingId: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  painting: Painting;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export type WallBookingStatus = 'requested' | 'confirmed' | 'declined' | 'cancelled';

export interface WallBooking {
  id: string;
  customerId: string;
  bookingDate: string;
  wallSizeSqFt: number;
  ratePerSqFt: number;
  totalPrice: number;
  serviceAddress: string;
  status: WallBookingStatus;
  notes?: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PotteryItem {
  id: string;
  name: string;
}

export interface PotteryGlaze {
  id: string;
  name: string;
}

export type PotteryRequestStatus = 'requested' | 'accepted' | 'declined' | 'cancelled';

export interface PotteryRequest {
  id: string;
  customerId: string;
  potteryItemId: string;
  potteryGlazeId: string;
  quantity: number;
  neededByDate: string;
  status: PotteryRequestStatus;
  notes?: string;
  createdAt: string;
  item: PotteryItem;
  glaze: PotteryGlaze;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}
