
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    // Check if any admin user exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
      return;
    }


    // Use ADMIN_PASSWORD from environment, fallback to 'admin123' (not recommended for production)
    const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (!process.env.ADMIN_PASSWORD) {
      console.warn("⚠️  ADMIN_PASSWORD env variable not set. Using default password 'admin123'. This is insecure for production!");
    }
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const adminUser = await prisma.user.create({
      data: {
        email: "admin@streammaster.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

  } catch (error) {
    console.error("❌ Error creating default admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDatabase() {
  console.log("🌱 Starting database seed...");
  
  await createDefaultAdmin();
  
  console.log("🌱 Database seeding completed!");
}


// Run if called directly (ESM compatible)
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase();
}

export { seedDatabase, createDefaultAdmin };