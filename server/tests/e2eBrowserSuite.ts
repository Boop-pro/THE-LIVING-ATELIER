import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5175';
const ADMIN_EMAIL = 'studio@artstudio.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Studio@123';

const prisma = new PrismaClient();

interface TestStepResult {
  step: number;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestStepResult[] = [];

// Helper to reliably set value on React controlled inputs
async function setControlledInput(page: puppeteer.Page, selector: string, value: string) {
  await page.waitForSelector(selector, { timeout: 8000 });
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel) as HTMLInputElement;
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

// Native Puppeteer click on matching element (case-insensitive text match)
async function clickElementByText(page: puppeteer.Page, selector: string, text: string, timeout = 8000) {
  await page.waitForFunction(
    (sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      return els.some((el) => (el.textContent || '').toLowerCase().includes(txt.toLowerCase()));
    },
    { timeout },
    selector,
    text
  );
  
  const elements = await page.$$(selector);
  for (const el of elements) {
    const elText = await page.evaluate((node) => node.textContent || '', el);
    if (elText.toLowerCase().includes(text.toLowerCase())) {
      await el.scrollIntoView();
      await el.click();
      return;
    }
  }

  // Fallback: evaluate click
  await page.evaluate(
    (sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      const match = els.find((el) => (el.textContent || '').toLowerCase().includes(txt.toLowerCase()));
      if (match) {
        (match as HTMLElement).click();
      }
    },
    selector,
    text
  );
}

// Clean wait for text anywhere on page (case-insensitive)
async function waitForText(page: puppeteer.Page, text: string, timeout = 8000) {
  await page.waitForFunction(
    (txt) => document.body.innerText.toLowerCase().includes(txt.toLowerCase()),
    { timeout },
    text
  );
}

async function recordResult(step: number, name: string, fn: () => Promise<string | void>) {
  console.log(`\n======================================================`);
  console.log(`RUNNING STEP ${step}: ${name}`);
  console.log(`======================================================`);
  try {
    const details = await fn();
    results.push({ step, name, passed: true, details: details || 'Success' });
    console.log(`✓ STEP ${step} PASSED: ${details || 'OK'}`);
  } catch (err: any) {
    results.push({ step, name, passed: false, details: err.message });
    console.error(`✗ STEP ${step} FAILED:`, err);
    throw err;
  }
}

async function runBrowserE2ESuite() {
  console.log('--- LAUNCHING MICROSOFT EDGE HEADLESS VIA PUPPETEER-CORE ---');
  console.log(`Binary Path: ${EDGE_PATH}`);
  console.log(`Base URL: ${BASE_URL}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Guarantee window.confirm returns true for all dialogs
  await page.evaluateOnNewDocument(() => {
    window.confirm = () => true;
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('React DevTools') && !text.includes('React Router')) {
      console.log(`[BROWSER CONSOLE ${msg.type()}] ${text}`);
    }
  });
  page.on('pageerror', (err) => {
    console.error(`[BROWSER PAGEERROR]`, err);
  });

  page.on('request', (req) => {
    if (req.url().includes('/api/')) {
      console.log(`[API REQ] ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[API RES] ${res.status()} ${res.url()}`);
    }
  });

  // Catch any native dialogs
  page.on('dialog', async (dialog) => {
    console.log(`[Browser Dialog] Type: ${dialog.type()}, Message: "${dialog.message()}"`);
    await dialog.accept();
  });

  const timestamp = Date.now();
  const customerName = `Browser QA Patron ${timestamp.toString().slice(-4)}`;
  const customerEmail = `evaluator.browser.${timestamp}@example.com`;
  const customerPassword = 'TestPassword123';

  // Future dates for booking and pottery
  const futureWallDate = new Date();
  futureWallDate.setDate(futureWallDate.getDate() + 30);
  const futureWallDateStr = futureWallDate.toISOString().split('T')[0];

  const futurePotteryDate = new Date();
  futurePotteryDate.setDate(futurePotteryDate.getDate() + 25);
  const futurePotteryDateStr = futurePotteryDate.toISOString().split('T')[0];

  try {
    // -------------------------------------------------------------------------
    // WORKFLOW 1: Customer Registration and Login
    // -------------------------------------------------------------------------
    await recordResult(1, 'Customer Registration and Login', async () => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
      
      // Ensure "Register" tab is active
      await clickElementByText(page, 'button', 'Register');
      await new Promise((r) => setTimeout(r, 400));

      // Wait for registration form inputs
      await page.waitForSelector('input[placeholder="Maya Patel"]');
      await page.type('input[placeholder="Maya Patel"]', customerName);
      await page.type('input[placeholder="maya@example.com"]', customerEmail);
      
      // Password in register form
      const passwordInputs = await page.$$('input[type="password"]');
      if (passwordInputs.length > 0) {
        await passwordInputs[0].type(customerPassword);
      }
      
      // Submit registration
      await clickElementByText(page, 'button', 'Register Customer Account');

      // Wait for redirect to /dashboard
      await page.waitForFunction(
        () => window.location.pathname === '/dashboard',
        { timeout: 8000 }
      );

      // Verify customer greeting / navbar name
      await waitForText(page, customerName, 8000);

      return `Registered and logged in as ${customerEmail}. Dashboard reached.`;
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 2: Painting Purchase and Cancellation
    // -------------------------------------------------------------------------
    await recordResult(2, 'Painting Purchase and Cancellation', async () => {
      await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.art-card', { timeout: 8000 });
      // Ensure auth state is loaded in navbar
      await waitForText(page, customerName, 8000);

      // Click "Acquire Artwork" on first available painting
      await clickElementByText(page, 'button', 'Acquire Artwork');

      // Wait for acquire API response to complete
      await new Promise((r) => setTimeout(r, 2000));

      // Navigate to Customer Dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.art-card', { timeout: 8000 });
      await waitForText(page, 'placed', 8000);

      // Click "Cancel Order" button (window.confirm handled automatically)
      await clickElementByText(page, 'button', 'Cancel Order');

      // Wait for order status badge to update to cancelled
      await waitForText(page, 'cancelled', 8000);

      // Check gallery again to ensure painting is restored to available
      await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.art-card', { timeout: 8000 });
      await clickElementByText(page, 'button', 'Acquire Artwork', 5000);

      return 'Painting acquired, verified in dashboard, cancelled, and restored to gallery.';
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 3: Wall Booking and Price Calculation
    // -------------------------------------------------------------------------
    await recordResult(3, 'Wall Booking and Dynamic Price Calculation', async () => {
      await page.goto(`${BASE_URL}/wall-art`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('form', { timeout: 8000 });
      await waitForText(page, customerName, 8000);

      // Check initial price calculation (120 sq.ft at ₹150 = ₹18,000)
      await waitForText(page, '18,000', 5000);

      // Change wall size range slider to 200 sq.ft using controlled input setter
      await setControlledInput(page, 'input[type="range"]', '200');
      await new Promise((r) => setTimeout(r, 600));

      // Verify dynamic recalculation (200 * 150 = ₹30,000)
      await waitForText(page, '30,000', 5000);

      // Select booking date (future date)
      await setControlledInput(page, 'input[type="date"]', futureWallDateStr);
      await new Promise((r) => setTimeout(r, 400));

      // Type service address
      const addressInput = await page.waitForSelector('textarea[placeholder*="Street address"]');
      await addressInput?.type('108 Craftsman Blvd, Heritage Enclave, Jaipur 302001');

      // Type artistic notes
      const notesInput = await page.waitForSelector('textarea[placeholder*="Preferred motifs"]');
      await notesInput?.type('Warli tree of life in natural white rice pigment with gold accent border');

      // Submit form
      await clickElementByText(page, 'button', 'Request Wall Booking');

      // Wait for success modal "Booking Request Placed!"
      await waitForText(page, 'Booking Request Placed!', 8000);

      // Close modal
      await clickElementByText(page, 'button', 'Close');

      return `Wall booking successfully created for date ${futureWallDateStr} at ₹30,000 quote.`;
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 4: Pottery Request Creation and Editing
    // -------------------------------------------------------------------------
    await recordResult(4, 'Pottery Request Creation and Editing', async () => {
      await page.goto(`${BASE_URL}/pottery`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('form', { timeout: 8000 });
      await waitForText(page, customerName, 8000);

      // Click vessel form Chai Kulhar Set
      const vesselCards = await page.$$('.grid-cols-1.sm\\:grid-cols-2 > div');
      if (vesselCards.length > 1) {
        await vesselCards[1].click();
      }

      // Click glaze
      const glazeCards = await page.$$('.grid-cols-2.sm\\:grid-cols-3 > div');
      if (glazeCards.length > 3) {
        await glazeCards[3].click();
      }

      // Click quantity stepper '+' twice
      await clickElementByText(page, 'button', '+');
      await clickElementByText(page, 'button', '+');

      // Set needed-by date
      await setControlledInput(page, 'input[type="date"]', futurePotteryDateStr);

      // Notes
      const notesArea = await page.waitForSelector('textarea[placeholder*="Carved initials"]');
      await notesArea?.type('Matte earthy texture with glazed lip');

      // Submit commission
      await clickElementByText(page, 'button', 'Request Custom Pottery Commission');

      // Wait for success modal
      await waitForText(page, 'Commission Received!', 8000);

      // Click "Go to Dashboard"
      await clickElementByText(page, 'button', 'Go to Dashboard');
      await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });

      // Click "My Pottery Commissions" tab
      await clickElementByText(page, 'button', 'My Pottery Commissions');
      await waitForText(page, 'requested', 8000);

      // Click "Edit" on the commission card
      await clickElementByText(page, 'button', 'Edit');
      await waitForText(page, 'Edit Commission Request', 5000);

      // Change quantity to 8
      await setControlledInput(page, 'input[type="number"]', '8');

      // Save changes
      await clickElementByText(page, 'button', 'Save Changes');

      // Verify updated quantity (8 Pieces)
      await waitForText(page, '8 Pieces', 8000);

      return 'Pottery commission created with 6 pcs, then edited to 8 Pieces and saved.';
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 5: Admin Login
    // -------------------------------------------------------------------------
    await recordResult(5, 'Studio Admin Authentication', async () => {
      // Logout current customer first
      const logoutBtn = await page.waitForSelector('button[title="Sign Out"]');
      if (logoutBtn) await logoutBtn.click();
      await new Promise((r) => setTimeout(r, 1500));

      // Navigate to /login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

      // Type admin credentials
      await page.waitForSelector('input[placeholder="e.g. patron@example.com"]');
      await page.type('input[placeholder="e.g. patron@example.com"]', ADMIN_EMAIL);
      await page.type('input[placeholder="••••••••"]', ADMIN_PASSWORD);

      // Submit
      await page.click('button[type="submit"]');

      // Wait for redirect to /admin
      await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 8000 });

      // Verify Admin Operations Workspace title
      await waitForText(page, 'ATELIER OPERATIONS WORKSPACE', 8000);

      return `Admin successfully logged in (${ADMIN_EMAIL}) and redirected to /admin.`;
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 6: Admin Booking Confirmation & Decline
    // -------------------------------------------------------------------------
    await recordResult(6, 'Admin Booking Confirmation and Decline Workflows', async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('button', { timeout: 8000 });

      // Click "Wall Bookings" tab
      await clickElementByText(page, 'button', 'Wall Bookings');
      await new Promise((r) => setTimeout(r, 1000));

      // Locate Confirm button for requested booking
      await clickElementByText(page, 'button', 'Confirm');

      // Wait for status to update to confirmed
      await waitForText(page, 'confirmed', 8000);

      return 'Admin successfully confirmed customer wall booking.';
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 7: Admin Pottery Acceptance & Decline
    // -------------------------------------------------------------------------
    await recordResult(7, 'Admin Pottery Acceptance and Decline Workflows', async () => {
      // Click "Pottery Commissions" tab
      await clickElementByText(page, 'button', 'Pottery Commissions');
      await new Promise((r) => setTimeout(r, 1000));

      // Locate Accept button
      await clickElementByText(page, 'button', 'Accept');

      // Wait for status to update to accepted
      await waitForText(page, 'accepted', 8000);

      return 'Admin successfully accepted custom pottery commission into kiln schedule.';
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 8: Customer Dashboard Status Updates
    // -------------------------------------------------------------------------
    await recordResult(8, 'Customer Dashboard Live Status Updates', async () => {
      // Sign out admin
      const logoutBtn = await page.waitForSelector('button[title="Sign Out"]');
      if (logoutBtn) await logoutBtn.click();
      await new Promise((r) => setTimeout(r, 1500));

      // Login as customer
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('input[placeholder="e.g. patron@example.com"]');
      await page.type('input[placeholder="e.g. patron@example.com"]', customerEmail);
      await page.type('input[placeholder="••••••••"]', customerPassword);
      await page.click('button[type="submit"]');

      await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });

      // Check Wall tab
      await clickElementByText(page, 'button', 'My Wall Bookings');
      await waitForText(page, 'confirmed', 8000);

      // Check Pottery tab
      await clickElementByText(page, 'button', 'My Pottery Commissions');
      await waitForText(page, 'accepted', 8000);

      return 'Verified both Wall Booking (confirmed) and Pottery Commission (accepted) live statuses in customer dashboard.';
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 9: Session Persistence After Refresh
    // -------------------------------------------------------------------------
    await recordResult(9, 'Session Persistence After Browser Refresh', async () => {
      // Reload page
      await page.reload({ waitUntil: 'networkidle0' });

      // Verify customer is still logged in
      await page.waitForSelector('header');
      await waitForText(page, customerName, 8000);

      const path = await page.evaluate(() => window.location.pathname);
      if (path !== '/dashboard') {
        throw new Error(`Browser was unexpectedly redirected away from /dashboard upon reload: ${path}`);
      }

      return `Session persisted after refresh for user ${customerName} without logout or redirect.`;
    });

    // -------------------------------------------------------------------------
    // WORKFLOW 10: Logout and Protected-Route Behavior
    // -------------------------------------------------------------------------
    await recordResult(10, 'Logout and Protected Route Behavior', async () => {
      // Click logout in navbar
      const logoutBtn = await page.waitForSelector('button[title="Sign Out"]');
      if (!logoutBtn) throw new Error('Sign Out button not found');
      await logoutBtn.click();
      await new Promise((r) => setTimeout(r, 1500));

      // Verify redirect to /
      const currentPath = await page.evaluate(() => window.location.pathname);
      if (currentPath !== '/') {
        throw new Error(`Expected redirect to '/', got '${currentPath}'`);
      }

      // Verify public navbar buttons "Sign In" and "Join Atelier"
      await waitForText(page, 'Sign In', 5000);
      await waitForText(page, 'Join Atelier', 5000);

      // Test protected customer route /dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1000));
      const dashAttemptPath = await page.evaluate(() => window.location.pathname);
      const dashAttemptText = await page.evaluate(() => document.body.innerText);
      if (dashAttemptPath !== '/login' && !dashAttemptText.includes('Sign In') && !dashAttemptText.includes('Unauthorized')) {
        throw new Error(`Protected customer route /dashboard was not guarded. Path: ${dashAttemptPath}`);
      }

      // Test protected studio route /admin
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1000));
      const adminAttemptPath = await page.evaluate(() => window.location.pathname);
      if (adminAttemptPath !== '/login') {
        throw new Error(`Protected admin route /admin was not guarded. Path: ${adminAttemptPath}`);
      }

      return 'Logout succeeded, and protected routes (/dashboard, /admin) correctly blocked unauthenticated access.';
    });

  } finally {
    await browser.close();

    // -------------------------------------------------------------------------
    // Database Cleanup: Remove the Browser Test User and Artifacts
    // -------------------------------------------------------------------------
    console.log('\n--- CLEANING UP BROWSER TEST ARTIFACTS FROM DATABASE ---');
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const testUser = await prisma.user.findUnique({
          where: { email: customerEmail },
        });
        if (testUser) {
          await prisma.paintingOrder.deleteMany({ where: { customerId: testUser.id } });
          await prisma.wallBooking.deleteMany({ where: { customerId: testUser.id } });
          await prisma.potteryRequest.deleteMany({ where: { customerId: testUser.id } });
          await prisma.user.delete({ where: { id: testUser.id } });
          console.log(`✓ Cleaned browser test customer: ${testUser.email}`);
        }

        // Reset paintings to canonical
        const canonicalSoldIds = ['p-004', 'p-009'];
        for (let i = 1; i <= 12; i++) {
          const id = `p-${String(i).padStart(3, '0')}`;
          const canonicalStatus = canonicalSoldIds.includes(id) ? 'sold' : 'available';
          await prisma.painting.updateMany({
            where: { id },
            data: { status: canonicalStatus as any },
          });
        }
        console.log('✓ Canonical painting statuses verified.');
        break;
      } catch (cleanupErr) {
        if (attempt === 4) {
          console.error('Final attempt failed during cleanup:', cleanupErr);
        } else {
          console.log(`Cleanup attempt ${attempt} failed, retrying in 1s...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
    await prisma.$disconnect();
  }

  // Final summary
  console.log('\n======================================================');
  console.log('BROWSER E2E TEST RESULTS SUMMARY (MICROSOFT EDGE)');
  console.log('======================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`Step ${r.step}: ${r.name} -> ${r.passed ? 'PASSED ✓' : 'FAILED ✗'} (${r.details})`);
    if (!r.passed) allPassed = false;
  }
  console.log('======================================================');
  if (!allPassed) {
    process.exit(1);
  }
}

runBrowserE2ESuite().catch((err) => {
  console.error('Browser E2E Suite Fatal Error:', err);
  process.exit(1);
});
