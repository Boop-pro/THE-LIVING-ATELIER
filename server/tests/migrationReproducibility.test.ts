import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/prisma';

describe('Version-Controlled Migration & Partial Index Reproducibility', () => {
  const testSchemaName = `test_migration_${Date.now()}`;

  afterAll(async () => {
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE;`);
    } catch (e) {
      console.warn('Schema cleanup warning:', e);
    }
  });

  it('should verify migration.sql exists in prisma/migrations', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../prisma/migrations/20261020000000_init/migration.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE TABLE "WallBooking"');
    expect(content).toContain('CREATE UNIQUE INDEX "unique_active_wall_booking_date"');
    expect(content).toContain("WHERE status IN ('requested', 'confirmed')");
  });

  it('should execute migration.sql in a fresh isolated schema and reproduce the partial unique index', async () => {
    // 0. Ensure Neon database connection is warmed up
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        break;
      } catch (err) {
        if (attempt === 4) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 1. Create a fresh isolated test schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${testSchemaName}";`);

    // 2. Read migration SQL
    const migrationPath = path.resolve(
      __dirname,
      '../prisma/migrations/20261020000000_init/migration.sql'
    );
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    // 3. Set search path strictly to isolated schema and execute migration statements inside pinned transaction
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET search_path TO "${testSchemaName}";`);
      
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await tx.$executeRawUnsafe(`${statement};`);
      }

      // 4. Verify that the partial unique index was created inside the isolated schema
      const indexResult: any[] = await tx.$queryRawUnsafe(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE schemaname = '${testSchemaName}' 
          AND tablename = 'WallBooking' 
          AND indexname = 'unique_active_wall_booking_date';
      `);

      expect(indexResult.length).toBe(1);
      expect(indexResult[0].indexname).toBe('unique_active_wall_booking_date');
      expect(indexResult[0].indexdef).toContain('WHERE (status = ANY');
    });

    // 5. Test partial index enforcement in the fresh schema:
    // Insert dummy user
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${testSchemaName}"."User" ("id", "email", "passwordHash", "name", "role", "updatedAt")
      VALUES ('u1', 'test@schema.org', 'hash', 'Test User', 'customer', NOW());
    `);

    // Insert first requested booking on 2026-12-01
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${testSchemaName}"."WallBooking" 
      ("id", "customerId", "bookingDate", "wallSizeSqFt", "ratePerSqFt", "totalPrice", "serviceAddress", "status", "updatedAt")
      VALUES ('wb1', 'u1', '2026-12-01', 100, 150, 15000, 'Test Address', 'requested', NOW());
    `);

    // Attempt second booking on the same date with 'confirmed' status -> MUST FAIL with unique violation!
    let duplicateFailed = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${testSchemaName}"."WallBooking" 
        ("id", "customerId", "bookingDate", "wallSizeSqFt", "ratePerSqFt", "totalPrice", "serviceAddress", "status", "updatedAt")
        VALUES ('wb2', 'u1', '2026-12-01', 200, 150, 30000, 'Another Address', 'confirmed', NOW());
      `);
    } catch (err: any) {
      duplicateFailed = true;
      expect(err.message).toMatch(/unique_active_wall_booking_date|duplicate key value|already exists|23505/i);
    }
    expect(duplicateFailed).toBe(true);

    // Cancel first booking (status -> 'cancelled') -> date should now be free!
    await prisma.$executeRawUnsafe(`
      UPDATE "${testSchemaName}"."WallBooking" SET "status" = 'cancelled' WHERE "id" = 'wb1';
    `);

    // Insert new booking on the now-released date -> MUST SUCCEED!
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${testSchemaName}"."WallBooking" 
      ("id", "customerId", "bookingDate", "wallSizeSqFt", "ratePerSqFt", "totalPrice", "serviceAddress", "status", "updatedAt")
      VALUES ('wb3', 'u1', '2026-12-01', 150, 150, 22500, 'New Client Address', 'requested', NOW());
    `);

    // Reset search path
    await prisma.$executeRawUnsafe(`SET search_path TO public;`);
  });
});
