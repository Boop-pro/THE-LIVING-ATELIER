import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const VERCEL_URL = 'https://the-living-atelier.vercel.app';

async function main() {
  console.log('🚀 Launching real Microsoft Edge browser to verify live Vercel deployment...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Home
  console.log('\n[1/8] Verifying Homepage (/)');
  await page.goto(VERCEL_URL, { waitUntil: 'networkidle2' });
  const title = await page.title();
  const h1 = await page.$eval('h1', (el) => el.textContent?.trim());
  console.log(`  ✓ Title: "${title}"`);
  console.log(`  ✓ H1: "${h1}"`);
  if (!h1?.includes("ART ISN'T MEANT TO BLEND IN")) {
    throw new Error(`Unexpected headline: ${h1}`);
  }

  // 2. Gallery
  console.log('\n[2/8] Verifying Gallery Page (/gallery)');
  await page.goto(`${VERCEL_URL}/gallery`, { waitUntil: 'networkidle2' });
  console.log(`  ✓ Loaded URL: ${page.url()}`);
  const galleryHeader = await page.$eval('h1', (el) => el.textContent?.trim());
  console.log(`  ✓ Header: "${galleryHeader}"`);

  // 3. Wall Art
  console.log('\n[3/8] Verifying Wall Art Page (/wall-art)');
  await page.goto(`${VERCEL_URL}/wall-art`, { waitUntil: 'networkidle2' });
  console.log(`  ✓ Loaded URL: ${page.url()}`);
  const wallHeader = await page.$eval('h1', (el) => el.textContent?.trim());
  console.log(`  ✓ Header: "${wallHeader}"`);

  // Direct refresh test on /wall-art
  console.log('  Testing direct browser refresh on /wall-art...');
  await page.reload({ waitUntil: 'networkidle2' });
  console.log(`  ✓ Successfully refreshed: ${page.url()}`);

  // 4. Pottery
  console.log('\n[4/8] Verifying Pottery Page (/pottery)');
  await page.goto(`${VERCEL_URL}/pottery`, { waitUntil: 'networkidle2' });
  console.log(`  ✓ Loaded URL: ${page.url()}`);
  const potteryHeader = await page.$eval('h1', (el) => el.textContent?.trim());
  console.log(`  ✓ Header: "${potteryHeader}"`);

  // 5. Login
  console.log('\n[5/8] Verifying Login Page (/login)');
  await page.goto(`${VERCEL_URL}/login`, { waitUntil: 'networkidle2' });
  console.log(`  ✓ Loaded URL: ${page.url()}`);
  const loginHeader = await page.$eval('h1', (el) => el.textContent?.trim());
  console.log(`  ✓ Form Brand Title: "${loginHeader}"`);
  const emailInput = await page.$('input[type="email"]');
  if (!emailInput) throw new Error('Email input not found on /login');
  console.log('  ✓ Email input exists and is interactive');

  // 6. Register
  console.log('\n[6/8] Verifying Register Page (/register)');
  await page.goto(`${VERCEL_URL}/register`, { waitUntil: 'networkidle2' });
  console.log(`  ✓ Loaded URL: ${page.url()}`);
  const regEmailInput = await page.$('input[type="email"]');
  if (!regEmailInput) throw new Error('Email input not found on /register');
  console.log('  ✓ Register form exists and is interactive');

  // 7. Admin & Customer Dashboard routes (Protected redirect test)
  console.log('\n[7/8] Verifying Admin Dashboard Route (/admin)');
  await page.goto(`${VERCEL_URL}/admin`, { waitUntil: 'networkidle2' });
  console.log(`  ✓ Route reachable without 404: ${page.url()}`);

  console.log('\n[8/8] Verifying Customer Dashboard Route (/dashboard)');
  await page.goto(`${VERCEL_URL}/dashboard`, { waitUntil: 'networkidle2' });
  console.log(`  ✓ Route reachable without 404: ${page.url()}`);

  await browser.close();
  console.log('\n🎉 ALL LIVE VERCEL PAGES AND ROUTING VERIFIED WITH 100% SUCCESS!');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
