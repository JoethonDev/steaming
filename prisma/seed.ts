import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

    // Create default admin user
    const defaultPassword = "admin123"; // Change this for production
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

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase, createDefaultAdmin };