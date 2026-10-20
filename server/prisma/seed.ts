import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Locate seed.json
  const possiblePaths = [
    path.resolve(__dirname, '../../seedData/seed.json'),
    path.resolve(__dirname, '../seedData/seed.json'),
    path.resolve(__dirname, './seedData/seed.json'),
    path.resolve(process.cwd(), 'seedData/seed.json')
  ];

  let seedFilePath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      seedFilePath = p;
      break;
    }
  }

  if (!seedFilePath) {
    throw new Error(`seed.json not found in any of: ${possiblePaths.join(', ')}`);
  }

  console.log(`Found seed data at: ${seedFilePath}`);
  const rawData = fs.readFileSync(seedFilePath, 'utf-8');
  const seedData = JSON.parse(rawData);

  // 1. Studio Admin Account
  const studioInfo = seedData.studioAccount;
  if (studioInfo) {
    const adminPassword = process.env.ADMIN_PASSWORD || studioInfo.password;
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const studioUser = await prisma.user.upsert({
      where: { email: studioInfo.email },
      update: {
        role: 'studio',
        name: 'The Living Atelier Admin'
      },
      create: {
        email: studioInfo.email,
        passwordHash,
        name: 'The Living Atelier Admin',
        role: 'studio'
      }
    });
    console.log(`✓ Seeded Studio Admin: ${studioUser.email} (${studioUser.role})`);
  }

  // 2. Paintings
  if (Array.isArray(seedData.paintings)) {
    for (const p of seedData.paintings) {
      await prisma.painting.upsert({
        where: { id: p.id },
        update: {
          title: p.title,
          artist: p.artist,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          status: p.status
        },
        create: {
          id: p.id,
          title: p.title,
          artist: p.artist,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          status: p.status
        }
      });
    }
    console.log(`✓ Seeded ${seedData.paintings.length} Paintings`);
  }

  // 3. Pottery Items
  if (Array.isArray(seedData.potteryItems)) {
    for (const item of seedData.potteryItems) {
      await prisma.potteryItem.upsert({
        where: { id: item.id },
        update: { name: item.name },
        create: { id: item.id, name: item.name }
      });
    }
    console.log(`✓ Seeded ${seedData.potteryItems.length} Pottery Items`);
  }

  // 4. Glazes
  if (Array.isArray(seedData.glazes)) {
    for (const g of seedData.glazes) {
      await prisma.potteryGlaze.upsert({
        where: { id: g.id },
        update: { name: g.name },
        create: { id: g.id, name: g.name }
      });
    }
    console.log(`✓ Seeded ${seedData.glazes.length} Pottery Glazes`);
  }

  // 5. Wall Painting Rate
  const muralRate = seedData.mural?.ratePerSqFt || 150;
  const existingRate = await prisma.wallPaintingRate.findFirst({
    where: { isActive: true }
  });
  if (!existingRate) {
    await prisma.wallPaintingRate.create({
      data: {
        ratePerSqFt: muralRate,
        isActive: true
      }
    });
    console.log(`✓ Seeded Wall Painting Rate: ₹${muralRate}/sq.ft`);
  } else {
    await prisma.wallPaintingRate.update({
      where: { id: existingRate.id },
      data: { ratePerSqFt: muralRate }
    });
    console.log(`✓ Updated Wall Painting Rate: ₹${muralRate}/sq.ft`);
  }

  // 6. PostgreSQL Partial Unique Index for Active Wall Bookings
  try {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_active_wall_booking_date
      ON "WallBooking" ("bookingDate")
      WHERE status IN ('requested', 'confirmed');
    `);
    console.log('✓ Verified PostgreSQL partial unique index: unique_active_wall_booking_date');
  } catch (err: any) {
    console.warn('Notice on partial unique index creation:', err.message);
  }

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
