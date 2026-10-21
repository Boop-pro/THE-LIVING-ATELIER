const rawApiUrl = (import.meta as any).env?.VITE_API_URL || '/api';

/**
 * Normalizes the API base URL to ensure clean, consistent paths:
 * - Trims whitespace and trailing slashes
 * - Guarantees '/api' suffix (e.g. 'https://host.onrender.com' -> 'https://host.onrender.com/api')
 * - Prevents duplicate '/api/api'
 * - Falls back to '/api' for local Vite proxy
 */
export function normalizeApiUrl(base: string): string {
  if (!base || base === '/api') return '/api';
  const trimmed = base.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE_URL = normalizeApiUrl(rawApiUrl);

export class ApiError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  
  // Dual authentication: attach Bearer token from localStorage for cross-origin resiliency
  const token = typeof window !== 'undefined' ? localStorage.getItem('atelier_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HTTP-only auth cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = data.message || 'An unexpected error occurred';
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      errorMsg = data.errors.map((e: any) => `${e.field ? `${e.field}: ` : ''}${e.message}`).join(', ');
    }
    throw new ApiError(errorMsg, response.status, data.errors);
  }

  return data as T;
}

export const api = {
  // Authentication
  register: async (body: { name: string; email: string; password: string }) => {
    const res = await request<{ success: boolean; user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('atelier_token', res.token);
    }
    return res;
  },

  login: async (body: { email: string; password: string }) => {
    const res = await request<{ success: boolean; user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('atelier_token', res.token);
    }
    return res;
  },

  logout: async () => {
    try {
      return await request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('atelier_token');
      }
    }
  },

  getCurrentUser: () =>
    request<{ success: boolean; user: any }>('/auth/me', {
      method: 'GET',
    }),

  // Paintings
  getPaintings: () =>
    request<{ success: boolean; paintings: any[] }>('/paintings', {
      method: 'GET',
    }),

  getPainting: (id: string) =>
    request<{ success: boolean; painting: any }>(`/paintings/${id}`, {
      method: 'GET',
    }),

  purchasePainting: (id: string) =>
    request<{ success: boolean; message: string; order: any }>(`/paintings/${id}/purchase`, {
      method: 'POST',
    }),

  createPainting: (body: any) =>
    request<{ success: boolean; message: string; painting: any }>('/paintings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updatePainting: (id: string, body: any) =>
    request<{ success: boolean; message: string; painting: any }>(`/paintings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getMyPaintingOrders: () =>
    request<{ success: boolean; orders: any[] }>('/paintings/orders/my', {
      method: 'GET',
    }),

  getAllPaintingOrders: () =>
    request<{ success: boolean; orders: any[] }>('/paintings/orders/all', {
      method: 'GET',
    }),

  cancelPaintingOrder: (orderId: string) =>
    request<{ success: boolean; message: string; order: any }>(`/paintings/orders/${orderId}/cancel`, {
      method: 'POST',
    }),

  // Wall Bookings
  getWallAvailability: () =>
    request<{ success: boolean; ratePerSqFt: number; bookedDates: string[] }>('/wall-bookings/availability', {
      method: 'GET',
    }),

  createWallBooking: (body: { bookingDate: string; wallSizeSqFt: number; serviceAddress: string; notes?: string }) =>
    request<{ success: boolean; message: string; booking: any }>('/wall-bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMyWallBookings: () =>
    request<{ success: boolean; bookings: any[] }>('/wall-bookings/my', {
      method: 'GET',
    }),

  getAllWallBookings: () =>
    request<{ success: boolean; bookings: any[] }>('/wall-bookings/all', {
      method: 'GET',
    }),

  cancelWallBooking: (id: string) =>
    request<{ success: boolean; message: string; booking: any }>(`/wall-bookings/${id}/cancel`, {
      method: 'POST',
    }),

  confirmWallBooking: (id: string) =>
    request<{ success: boolean; message: string; booking: any }>(`/wall-bookings/${id}/confirm`, {
      method: 'PATCH',
    }),

  declineWallBooking: (id: string) =>
    request<{ success: boolean; message: string; booking: any }>(`/wall-bookings/${id}/decline`, {
      method: 'PATCH',
    }),

  // Pottery
  getPotteryItems: () =>
    request<{ success: boolean; items: any[] }>('/pottery/items', {
      method: 'GET',
    }),

  getPotteryGlazes: () =>
    request<{ success: boolean; glazes: any[] }>('/pottery/glazes', {
      method: 'GET',
    }),

  createPotteryRequest: (body: { potteryItemId: string; potteryGlazeId: string; quantity: number; neededByDate: string; notes?: string }) =>
    request<{ success: boolean; message: string; request: any }>('/pottery', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  editPotteryRequest: (id: string, body: any) =>
    request<{ success: boolean; message: string; request: any }>(`/pottery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  cancelPotteryRequest: (id: string) =>
    request<{ success: boolean; message: string; request: any }>(`/pottery/${id}/cancel`, {
      method: 'POST',
    }),

  getMyPotteryRequests: () =>
    request<{ success: boolean; requests: any[] }>('/pottery/my', {
      method: 'GET',
    }),

  getAllPotteryRequests: () =>
    request<{ success: boolean; requests: any[] }>('/pottery/all', {
      method: 'GET',
    }),

  acceptPotteryRequest: (id: string) =>
    request<{ success: boolean; message: string; request: any }>(`/pottery/${id}/accept`, {
      method: 'PATCH',
    }),

  declinePotteryRequest: (id: string) =>
    request<{ success: boolean; message: string; request: any }>(`/pottery/${id}/decline`, {
      method: 'PATCH',
    }),
};
