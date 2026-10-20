import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function rotate() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('server/.env not found');
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Generate 256-bit secure hex tokens
  const newJwtSecret = crypto.randomBytes(32).toString('hex');
  const newCookieSecret = crypto.randomBytes(32).toString('hex');
  const newAdminPassword = crypto.randomBytes(18).toString('base64url');

  // Replace or append in envContent
  if (envContent.includes('JWT_SECRET=')) {
    envContent = envContent.replace(/JWT_SECRET=.*/g, `JWT_SECRET="${newJwtSecret}"`);
  } else {
    envContent += `\nJWT_SECRET="${newJwtSecret}"`;
  }

  if (envContent.includes('COOKIE_SECRET=')) {
    envContent = envContent.replace(/COOKIE_SECRET=.*/g, `COOKIE_SECRET="${newCookieSecret}"`);
  } else {
    envContent += `\nCOOKIE_SECRET="${newCookieSecret}"`;
  }

  if (envContent.includes('ADMIN_PASSWORD=')) {
    envContent = envContent.replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD="${newAdminPassword}"`);
  } else {
    envContent += `\nADMIN_PASSWORD="${newAdminPassword}"`;
  }

  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log('✓ Rotated JWT_SECRET and COOKIE_SECRET with 256-bit random keys in server/.env');
  console.log('✓ Generated new secure ADMIN_PASSWORD in server/.env');

  // Update Studio Admin in Database
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(newAdminPassword, 10);
    const updated = await prisma.user.update({
      where: { email: 'studio@artstudio.in' },
      data: { passwordHash },
    });
    console.log(`✓ Updated Studio Admin (${updated.email}) password hash in database`);
  } finally {
    await prisma.$disconnect();
  }
}

rotate().catch((err) => {
  console.error('Error during secret rotation:', err.message);
  process.exit(1);
});
