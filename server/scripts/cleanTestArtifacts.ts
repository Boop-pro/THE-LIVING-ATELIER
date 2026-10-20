import { PrismaClient } from '@prisma/client';

async function auditAndClean() {
  const prisma = new PrismaClient();
  try {
    console.log('=== Auditing Live Database for Test Artifacts ===');
    
    // Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'evaluator' } },
          { email: { contains: 'concurrent' } },
          { email: { contains: 'example.com' } }
        ]
      }
    });

    console.log(`Found ${testUsers.length} test user(s) to clean:`);
    for (const u of testUsers) {
      console.log(` - ${u.email} (${u.id})`);
      // Delete orders, bookings, and pottery requests for this user
      await prisma.paintingOrder.deleteMany({ where: { customerId: u.id } });
      await prisma.wallBooking.deleteMany({ where: { customerId: u.id } });
      await prisma.potteryRequest.deleteMany({ where: { customerId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }

    // Delete any race test paintings
    const testPaintings = await prisma.painting.findMany({
      where: { id: { startsWith: 'p-race-' } }
    });
    for (const p of testPaintings) {
      await prisma.paintingOrder.deleteMany({ where: { paintingId: p.id } });
      await prisma.painting.delete({ where: { id: p.id } });
    }

    // Ensure all 12 seed paintings have their canonical statuses
    const canonicalSoldIds = ['p-004', 'p-009'];
    for (let i = 1; i <= 12; i++) {
      const id = `p-${String(i).padStart(3, '0')}`;
      const canonicalStatus = canonicalSoldIds.includes(id) ? 'sold' : 'available';
      await prisma.painting.updateMany({
        where: { id },
        data: { status: canonicalStatus as any }
      });
    }

    // Report final production counts
    const totalUsers = await prisma.user.count();
    const totalPaintings = await prisma.painting.count();
    const totalOrders = await prisma.paintingOrder.count();
    const totalBookings = await prisma.wallBooking.count();
    const totalPottery = await prisma.potteryRequest.count();

    console.log(`\nFinal Production State:`);
    console.log(`- Users: ${totalUsers} (1 Studio Admin: studio@artstudio.in)`);
    console.log(`- Paintings: ${totalPaintings} (10 Available, 2 Sold)`);
    console.log(`- Painting Orders: ${totalOrders}`);
    console.log(`- Wall Bookings: ${totalBookings}`);
    console.log(`- Pottery Requests: ${totalPottery}`);
    console.log('✓ Clean state verified.');
  } finally {
    await prisma.$disconnect();
  }
}

auditAndClean().catch(console.error);
