import 'dotenv/config';
import { PrismaClient, AuctionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Clearing existing records from Neon PostgreSQL...');

  // Clean old records in correct order to prevent broken relations
  await prisma.bid.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.auctionViewer.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🔑 Hashing default passwords...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. Create Default Seller User
  const seller = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      passwordHash: hashedPassword,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
      role: 'seller',
    },
  });

  // 2. Create Default Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@geekybid.com',
      passwordHash: adminPassword,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin',
      role: 'admin',
    },
  });

  console.log('👤 Created default Seller and Admin users.');

  // 3. Define Mock Auctions
  const mockAuctions = [
    {
      title: 'Vintage Leica M3 Rangefinder Camera',
      description: 'Classic 1954 35mm rangefinder camera in excellent working condition with original 50mm Summicron lens.',
      category: 'photography',
      startingBid: 1000,
      currentPrice: 1250,
      status: AuctionStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f'],
      endTime: new Date(Date.now() + 3 * 3600 * 1000),
      sellerId: seller.id,
    },
    {
      title: 'Apple Macintosh SE/30 (1989)',
      description: 'Fully restored vintage Apple Macintosh SE/30 with upgraded RAM and clean CRT monitor.',
      category: 'electronics',
      startingBid: 300,
      currentPrice: 420,
      status: AuctionStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f'],
      endTime: new Date(Date.now() + 18 * 3600 * 1000),
      sellerId: seller.id,
    },
    {
      title: 'First Edition Charizard Shadowless Holographic Card',
      description: 'PSA 8 Graded 1999 Pokémon Game Shadowless Charizard Holo.',
      category: 'collectibles',
      startingBid: 2500,
      currentPrice: 3100,
      status: AuctionStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1613771404784-3a5686aa2be3'],
      endTime: new Date(Date.now() + 1 * 3600 * 1000),
      sellerId: admin.id,
    },
  ];

  // 4. Seed Auctions into PostgreSQL
  for (const auctionData of mockAuctions) {
    await prisma.auction.create({
      data: auctionData,
    });
  }

  console.log(`✅ Seed complete! Inserted users and ${mockAuctions.length} mock auctions into PostgreSQL.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });