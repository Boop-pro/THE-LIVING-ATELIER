# The Living Atelier 🎨
### Full-Stack Contemporary Art Studio Platform
**Tagline:** *Art Isn't Meant to Blend In.*

---

## 🌟 Executive Summary

**The Living Atelier** is a full-stack contemporary art studio web application designed to connect patrons with master artisans. The platform rejects generic corporate aesthetics and minimal beige luxury in favor of an expressive, bold, and playful visual identity using:
- **Primary Page Background**: Blush Pink (`#FFE8E5`)
- **Primary Art Accent**: Soft Lavender (`#B9A2E8`)
- **Electric Accent**: Chartreuse (`#D7FF43`)
- **Vibrant Alert / Coral**: Tomato Red (`#F34F40`)
- **Deep Contrast Typography**: Ink (`#24211F`)

The platform supports two distinct roles (**Customer** and **Studio Admin**) and three core services:
1. **Original Folk & Contemporary Paintings**: Collect one-of-a-kind artworks backed by atomic concurrency protection and single-edition provenance. Sold artworks are permanently locked and cannot be purchased or edited.
2. **Architectural Wall Murals**: Interactive booking with dynamic area calculation (10–500 sq.ft @ ₹150/sq.ft), calendar availability (7–90 days lead time), and 3-day cancellation cutoff. Active dates are guarded at the database level by a PostgreSQL partial unique index.
3. **Custom Pottery Commissions**: Commission handcrafted ceramics from 5 seeded vessel forms and 6 natural mineral glazes, with batch quantity control (1–12 pieces) and a 14-day kiln lead time.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, TanStack Query, React Hook Form, Zod, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Zod, JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors` |
| **Database** | PostgreSQL (Neon Cloud Serverless & Local PostgreSQL Engine) with Version-Controlled Prisma Migrations |
| **Testing** | Vitest, Supertest, Puppeteer-Core with Microsoft Edge for Real Browser Automation, Database-Level Race Condition Testing |
| **Deployment** | Vercel (Frontend SPA), Render (Backend API Web Service), Neon (PostgreSQL Database) |

---

## 📂 Repository Architecture

```
ArtStudioWebsite/
├── client/                     # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Footer, LoadingSkeleton, Toast
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── pages/              # Home, Gallery, WallArt, Pottery, Auth, CustomerDashboard, AdminDashboard, NotFound
│   │   ├── services/           # api.ts (Fetch client with HTTP-only cookies)
│   │   ├── types/              # TypeScript models & enums
│   │   └── App.tsx, main.tsx, index.css
│   ├── public/images/          # Seed artwork images (p-001.jpg to p-012.jpg)
│   ├── tailwind.config.js      # The Living Atelier custom design system
│   ├── vercel.json             # Vercel SPA routing rewrite rules
│   ├── .env.example            # Frontend environment variable template
│   └── vite.config.ts          # Dev proxy & bundling setup
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── controllers/        # Auth, Paintings, WallBookings, Pottery
│   │   ├── middleware/         # Auth, RBAC, Centralized Error Handler
│   │   ├── routes/             # REST endpoints (/api/auth, /api/paintings, /api/wall-bookings, /api/pottery, /health)
│   │   ├── services/           # Business logic & atomic transactions
│   │   ├── validators/         # Zod schemas & calendar date helpers
│   │   └── app.ts, index.ts, prisma.ts
│   ├── prisma/
│   │   ├── schema.prisma       # Normalized PostgreSQL schema
│   │   ├── migrations/         # Version-controlled migrations (20261020000000_init)
│   │   └── seed.ts             # Idempotent seed script from seedData/seed.json
│   ├── tests/                  # 58 automated unit/integration tests + Edge browser E2E suite
│   ├── scripts/                # cleanTestArtifacts.ts, rotateSecrets.ts
│   ├── .env.example            # Backend environment variable template
│   └── public/images/          # Served static painting assets
├── seedData/                   # Official dataset: seed.json & 12 painting images
├── .env.example                # Root environment configuration template
├── .gitignore                  # Production gitignore protecting all secrets
├── package.json                # Monorepo workspaces & startup scripts
├── README.md                   # Complete system documentation
└── DESIGN.md                   # Architectural decisions, concurrency & security details
```

---

## 🚀 Local Setup & Quickstart

### Prerequisites
- **Node.js** (v18.0.0 or higher; tested on v22+)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** (Neon cloud connection string or local PostgreSQL instance)
- **Microsoft Edge or Google Chrome** (for browser automation tests)

### 1. Installation
Install all dependencies across both workspaces:
```bash
npm install --prefix server
npm install --prefix client
```

### 2. Environment Variables Configuration
Copy the environment template into `server/.env`:
```bash
cp server/.env.example server/.env
```

Configure `server/.env` with your PostgreSQL database URL and secrets:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
TEST_DATABASE_URL="postgresql://username:password@host/dbname_test?sslmode=require"
JWT_SECRET="your-secure-random-64-byte-hex-secret"
COOKIE_SECRET="your-secure-random-64-byte-hex-cookie-secret"
FRONTEND_URL="http://localhost:5173"
ADMIN_PASSWORD="Studio@123"
```

### 3. Database Migration & Official Seed Data
Run the version-controlled Prisma migration and official seed script:
```bash
# Generate Prisma Client
npm run prisma:generate --prefix server

# Apply database migration (creates schema and partial unique index)
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# Seed official data (paintings, glazes, pottery forms, studio admin)
npm run prisma:seed --prefix server
```

The seed script idempotently populates:
- **1 Studio Admin**: `studio@artstudio.in` (Role: `studio`)
- **12 Official Paintings**: `p-001` through `p-012` (with canonical sold statuses on `p-004` and `p-009`)
- **5 Ceramic Vessel Forms**: Kulhad, Surahi, Matka, Diya set, Gamla
- **6 Natural Mineral Glazes**: Kumkum Red, Haldi Yellow, Mehendi Green, Indigo Blue, Sandalwood Beige, Charcoal Black
- **Architectural Mural Rate**: ₹150 / sq.ft
- **Partial Unique Index**: `unique_active_wall_booking_date` on `WallBooking` (`bookingDate`) `WHERE status IN ('requested', 'confirmed')`

### 4. Running the Development Servers
In two separate terminals:
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev --prefix server

# Terminal 2: Frontend UI (http://localhost:5175 or http://localhost:5173)
npm run dev --prefix client
```

---

## 🧪 Automated Testing Suite

The application includes **58 backend automated tests** and a **10-step real browser automation test suite** using Puppeteer-Core driving Microsoft Edge.

### 1. Backend Test Suite (58 Passing Tests)
```bash
npm test --prefix server
```
Test Suites:
1. `businessRules.test.ts` (17 tests): Role boundaries, registration restrictions, wall dimensions (10–500 sq.ft), calendar range (7–90 days), pottery batch limits (1–12 pieces), 14-day lead times.
2. `concurrency.test.ts` (8 tests): Race condition prevention, double-booking prevention, 3-day cancellation cutoffs.
3. `apiEndpoints.test.ts` (9 tests): HTTP status codes, 401 unauthenticated, 403 unauthorized, 404 not found, input validation.
4. `liveDatabaseWorkflows.test.ts` (20 tests): End-to-end integration against Neon PostgreSQL covering painting acquisition, cancellation, wall booking, date conflict rejections, admin approvals, and pottery commissions.
5. `trueDatabaseConcurrency.test.ts` (2 tests): True concurrent load tests firing 5 simultaneous requests against PostgreSQL. Verifies exactly 1 succeeds and 4 receive HTTP 409 Conflict.
6. `migrationReproducibility.test.ts` (2 tests): Spins up a fresh isolated PostgreSQL schema, executes `migration.sql`, and proves the partial unique index reproduces cleanly.

### 2. Real Browser Automation Suite (10 Comprehensive Workflows)
With backend and frontend running:
```bash
npm run test:e2e --prefix server
```
This launches headless Microsoft Edge (`msedge.exe`) and autonomously tests:
1. **Customer Registration & Login**: Creates customer account, verifies auth cookies and navbar greeting.
2. **Painting Acquisition & Cancellation**: Collects an artwork, verifies order on customer dashboard, cancels order, and verifies painting availability is restored.
3. **Wall Booking & Dynamic Price Calculation**: Verifies interactive slider recalculation (₹18,000 -> ₹30,000), date selection, address input, and booking modal.
4. **Pottery Commission Creation & Editing**: Configures vessel form, mineral glaze, quantity stepper, needed-by date, submits commission, edits batch quantity to 8 Pieces, and saves changes.
5. **Studio Admin Authentication**: Authenticates as `studio@artstudio.in`, redirects to `/admin` operations workspace.
6. **Admin Booking Approval**: Confirms requested wall booking date.
7. **Admin Pottery Acceptance**: Accepts pottery commission into kiln queue.
8. **Live Customer Dashboard Updates**: Logs back in as customer, verifies status badges reflect `confirmed` (wall) and `accepted` (pottery).
9. **Session Persistence**: Performs hard page reload (`networkidle0`) and verifies session remains fully intact without redirect.
10. **Logout & Protected Route Guarding**: Logs out, verifies navbar resets to public links, and verifies guarded routes (`/dashboard`, `/admin`) block access and redirect to `/login`.
11. **Automatic Test Cleanup**: Purges test customer and test orders from Neon DB, leaving 0 dirty records.

---

## 📋 Manual Browser Testing Checklist

If testing manually in Chrome, Edge, Safari, or Firefox:

| # | Step | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| **1** | **Customer Registration** | Navigate to `/register`. Enter Name, Email, Password (min 6 chars). Click "Register Customer Account". | User is registered, redirected to `/dashboard`, navbar shows customer name. |
| **2** | **Painting Purchase** | Navigate to `/gallery`. Click "Acquire Artwork" on an available painting. | Toast confirms acquisition. Badge updates to "Sold". Button updates to "Collected". |
| **3** | **Order Cancellation** | Navigate to `/dashboard`. On Paintings tab, click "Cancel Order". Confirm dialog. | Order status updates to "cancelled". Gallery painting returns to "Available". |
| **4** | **Wall Mural Booking** | Navigate to `/wall-art`. Move slider to 200 sq.ft. Select future date (7–90 days). Enter address. Submit. | Dynamic price calculates ₹30,000. Modal confirms request. Date is marked reserved. |
| **5** | **Pottery Commission** | Navigate to `/pottery`. Select Kulhad, select Indigo Blue, pick 6 pieces. Submit commission. | Success modal displays. Commission appears on `/dashboard` with status `requested`. |
| **6** | **Pottery Edit** | On `/dashboard` Pottery tab, click "Edit". Change quantity to 8 Pieces. Click "Save Changes". | Card updates immediately to display "8 Pieces". |
| **7** | **Admin Login** | Log out. Navigate to `/login`. Enter `studio@artstudio.in` and admin password. Click "Sign In". | Redirected to `/admin` "Atelier Operations Workspace". |
| **8** | **Admin Approvals** | Switch to "Wall Bookings" tab -> Click "Confirm". Switch to "Pottery Commissions" tab -> Click "Accept". | Wall booking status becomes `confirmed`. Pottery commission becomes `accepted`. |
| **9** | **Customer Verification** | Log out admin. Log in as customer. Open `/dashboard`. Check Wall and Pottery tabs. | Customer sees confirmed wall date and accepted kiln schedule. |
| **10** | **Session & Logout** | Refresh browser (`F5`). Verify still logged in. Click logout button. Visit `/dashboard` or `/admin`. | Session persists on refresh. Logout redirects to `/`. Direct dashboard visits redirect to `/login`. |

---

## 🔒 Security Audit & Best Practices

1. **Secret Key Isolation**:
   - `JWT_SECRET` and `COOKIE_SECRET` are rotated cryptographically using 64-byte random hex values (`crypto.randomBytes(64).toString('hex')`).
   - `.env` files are strictly excluded via `.gitignore` across root, server, and client. Only `.env.example` templates are tracked.
2. **No Client Trust for Authorization**:
   - The server extracts patron identity strictly from the verified JWT payload (`req.user.userId`, `req.user.role`).
   - Registration schemas forbid client-supplied roles.
   - Sold paintings are locked against edit operations (`HTTP 400`).
3. **CORS & Proxy Trust**:
   - `server/src/app.ts` enables `app.set('trust proxy', 1)` to support reverse proxies on Render and AWS.
   - CORS origin dynamically allows `config.frontendUrl`, local development ports, and Vercel domains (`.vercel.app`) with `credentials: true`.
4. **Cookie Security**:
   - Authentication cookies use `httpOnly: true`, `secure: config.isProduction`, and `sameSite: config.isProduction ? 'none' : 'lax'`.
5. **Sanitized Logs**:
   - Passwords and token secrets are never logged in console or response payloads.

---

## ☁️ Cloud Deployment Guide (Render + Vercel + Neon)

### STEP 1: GitHub Repository Initialization
```bash
# Initialize git repository (do not commit secrets)
git init
git add .
git commit -m "feat: complete The Living Atelier full-stack platform"
git branch -M main
git remote add origin https://github.com/<your-username>/the-living-atelier.git
git push -u origin main
```

### STEP 2: Neon Cloud Database Configuration
1. Log in to [Neon.tech](https://neon.tech) and create a PostgreSQL database.
2. Under **Connection Details**, select **Pooled connection** and copy the connection string:
   `postgresql://artstudio_owner:<password>@ep-...-pooler.region.aws.neon.tech/artstudio?sslmode=require`
3. In local terminal, run migrations against the Neon DB:
   ```bash
   DATABASE_URL="<your-neon-url>" npx prisma migrate deploy --schema=server/prisma/schema.prisma
   DATABASE_URL="<your-neon-url>" npx tsx server/prisma/seed.ts
   ```

### STEP 3: Render Backend Deployment
1. Log in to [Render.com](https://render.com) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure service parameters:
   - **Name**: `the-living-atelier-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Health Check Path**: `/health` (or `/api/health`)
4. Add **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `<your-neon-connection-string>`
   - `JWT_SECRET`: `<your-64-byte-random-hex-string>`
   - `COOKIE_SECRET`: `<your-64-byte-random-hex-string>`
   - `ADMIN_PASSWORD`: `<your-custom-production-admin-password>`
   - `FRONTEND_URL`: `https://the-living-atelier.vercel.app` (or your Vercel URL)
5. Deploy service. Copy the Render URL (e.g. `https://the-living-atelier-api.onrender.com`).

### STEP 4: Vercel Frontend Deployment
1. Log in to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_URL`: `https://the-living-atelier-api.onrender.com/api` (Render backend URL with `/api` suffix)
5. Deploy.
6. Verify SPA routing on page refresh (handled automatically by `client/vercel.json`).

### STEP 5: Live Verification
1. Open the live Vercel URL in your browser.
2. Register a customer account and verify authentication.
3. Acquire an original painting and confirm status in Collector Workspace.
4. Book a wall mural and commission a pottery piece.
5. Log into Studio Admin and confirm the bookings.
6. Verify live status updates on the customer dashboard.
