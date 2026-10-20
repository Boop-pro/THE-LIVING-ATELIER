# DESIGN.md — Architecture & Technical Design Decisions
## The Living Atelier — Full-Stack Art Studio Platform

### Tagline: *Art Isn't Meant to Blend In.*

---

## 1. How Login and the Two Roles Work

The Living Atelier enforces strict, state-of-the-art Role-Based Access Control (RBAC) across both frontend routing and server-side API endpoints.

### Authentication & Token Architecture
1. **Password Hashing**: User passwords are encrypted using `bcryptjs` with 10 salt rounds prior to persistence.
2. **Session Security**: Upon successful authentication (`/api/auth/login` or `/api/auth/register`), the backend signs an HMAC SHA-256 JSON Web Token (JWT) containing `{ userId, email, role }`.
3. **Cookie Transport**: The JWT is set in an HTTP-only, secure, `SameSite=lax` (or `SameSite=none` in cross-site production) cookie named `atelier_jwt`. This guarantees client-side JavaScript (and XSS attacks) cannot read the authentication token. For API clients and cross-origin mobile integrations, the server simultaneously supports the `Authorization: Bearer <token>` header.
4. **Current User Endpoint**: `/api/auth/me` verifies the token, verifies the user in the PostgreSQL database, and returns the sanitized user object without the password hash.

### Role Separation: `customer` vs. `studio`
- **Customer Role**:
  - Customers register publicly through `/register` or `/login`.
  - The registration validator (`registerSchema`) strictly enforces the `customer` role. Any client attempting to supply `role: "studio"` or `"admin"` in the request body is rejected with HTTP 400.
  - Customers can browse paintings, purchase available artworks, cancel their own placed orders, book wall murals (7–90 days out, 10–500 sq.ft, with 3-day cancellation cutoff), and commission pottery (1–12 pieces, 14-day lead time, with requested-only edit/cancel rights).
- **Studio Admin Role**:
  - Studio admin accounts can never be created via public registration.
  - The official studio account (`studio@artstudio.in` / `Studio@123`) is provisioned via the secure, idempotent database seed script (`server/prisma/seed.ts`) reading directly from the official `seedData/seed.json`.
  - The middleware `requireRole('studio')` guards administrative endpoints: adding/updating paintings, viewing all painting orders, confirming/declining wall mural bookings, and accepting/declining custom pottery commission requests.
- **Ownership Isolation**:
  - Customers can only access or modify their own records. Endpoints return HTTP 404 if a customer attempts to query or cancel another customer's order, booking, or pottery commission, preventing ID enumeration.

---

## 2. Which Database Was Chosen, and Why?

### Choice: PostgreSQL with Prisma ORM (Neon Cloud & Local Engine)

1. **Relational Data Integrity**:
   The Atelier business logic requires strict relational constraints: foreign keys connecting `User` to `PaintingOrder`, `WallBooking`, and `PotteryRequest`, with referential integrity guarantees (e.g. `onDelete: Restrict` on paintings and pottery items to ensure historical records are preserved).
2. **Concurrency & Partial Unique Indexes**:
   PostgreSQL uniquely provides **Partial Unique Indexes** (`CREATE UNIQUE INDEX ... WHERE status IN ('requested', 'confirmed')`), which allows enforcing business concurrency rules natively at the database engine level (see Section 3).
3. **ACID Transactions**:
   Atomicity and Isolation are mandatory for one-of-a-kind art purchases. PostgreSQL's read-committed and serializable transaction semantics guarantee that two collectors purchasing the same painting simultaneously will never result in duplicate orders.
4. **Developer Experience & Cloud Portability**:
   Prisma ORM provides type-safe TypeScript query generation, automated schema migrations, and zero-downtime branching on Neon serverless PostgreSQL, with a seamless fallback to local PostgreSQL 18.

---

## 3. How Simultaneous Purchases and Duplicate Wall Bookings Are Prevented

### A. Preventing Simultaneous Painting Purchases (Atomic Concurrency Protection)
Every painting in The Living Atelier is strictly one of a kind. If two patrons attempt to purchase the same artwork at the exact same millisecond:

```typescript
// server/src/services/paintingService.ts
return prisma.$transaction(async (tx) => {
  // 1. Transactional check
  const painting = await tx.painting.findUnique({ where: { id: paintingId } });
  if (!painting || painting.status === 'sold') {
    throw new AppError('Conflict: Painting has already been purchased.', 409);
  }

  // 2. Conditional Atomic Update: only updates if status is still 'available'
  const updateResult = await tx.painting.updateMany({
    where: { id: paintingId, status: 'available' },
    data: { status: 'sold' }
  });

  // If another transaction changed the status in the interim, count is 0
  if (updateResult.count === 0) {
    throw new AppError('Conflict: Artwork was just acquired by another collector.', 409);
  }

  // 3. Create the placed order atomically
  return tx.paintingOrder.create({
    data: { customerId, paintingId, totalAmount: painting.price, status: 'placed' },
    include: { painting: true }
  });
});
```

- If conflict occurs, HTTP 409 is returned, and the database transaction rolls back cleanly.
- Cancellation restores availability atomically (`order -> cancelled`, `painting -> available`).

### B. Preventing Duplicate Wall Bookings (Partial Unique Index)
The studio can only execute one wall mural per calendar date. However, declined and cancelled dates must immediately become available again for other clients:

```sql
-- server/prisma/seed.ts and schema migrations
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_wall_booking_date
ON "WallBooking" ("bookingDate")
WHERE status IN ('requested', 'confirmed');
```

1. **Database-Level Guarantee**: The PostgreSQL query planner enforces uniqueness only on rows where `status IN ('requested', 'confirmed')`.
2. **Automatic Date Release**: When an admin declines a booking or a client cancels their booking (eligible up to 3 days prior), the status transitions to `'declined'` or `'cancelled'`, removing the row from the partial index and immediately freeing that date.
3. **Race Condition Trap**: If two concurrent requests try to book the same date, PostgreSQL catches the race at the index level (error code `23505` / Prisma `P2002`), which our backend catches and translates to HTTP 409 Conflict.

---

## 4. What Was Completed, What Was Left Out, and What Would Be Done Next

### What Was Completed:
- Full normalized relational PostgreSQL database schema with users, paintings, orders, wall bookings, rates, pottery items, glazes, and requests.
- Idempotent seed script provisioning official data from `seedData/seed.json` (all 12 paintings with images, 5 pottery items, 6 mineral glazes, mural rate ₹150, and studio admin).
- Atomic concurrency protection on painting purchases with conditional updates and HTTP 409 responses.
- Partial unique index on active wall booking dates with automatic date release upon decline/cancellation.
- Strict wall booking rules (7–90 calendar days range, 10–500 sq.ft size, live calculation, 3-day cancellation cutoff).
- Strict pottery commission rules (1–12 pieces, >= 14 calendar days lead time, edit/cancel rights locked to `requested` status).
- Complete RBAC security with HTTP-only cookies, ownership isolation, and customer-only registration.
- 34 automated unit, integration, and concurrency tests passing with Vitest and Supertest.
- Full-featured React + TypeScript + Tailwind frontend with The Living Atelier visual identity (Lavender `#B9A2E8`, Electric Chartreuse `#D7FF43`, Tomato Red `#F34F40`, Cream `#FAF8F3`, Ink `#24211F`).
- Complete Client and Studio Admin dashboards with live actions.

### What Was Left Out:
- Third-party live payment gateway integration (Razorpay/Stripe): Orders are processed directly through the atelier's transactional ledger to avoid external payment gateway credential dependencies during offline evaluation.
- Email dispatch service (SendGrid/Resend): Confirmations are logged to database and displayed in real-time in the client dashboard.

### What Would Be Done Next:
1. **Interactive Wall Visualizer (Canvas/WebGL)**: Allow customers to upload a photo of their wall and preview simulated mural scales before submitting bookings.
2. **3D Ceramic Glaze Inspector**: Three.js / Mol* style 3D clay model previewing Kumkum Red, Haldi Yellow, and Indigo Blue finishes under studio lighting.
3. **SMS / WhatsApp Studio Notifications**: Real-time alerts to the studio master when urgent wall mural requests are submitted.
