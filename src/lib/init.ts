import { createDefaultAdmin } from "../../prisma/seed";

// Initialize default admin user if it doesn't exist
export async function initializeApp() {
  try {
    await createDefaultAdmin();
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
}

// Auto-run initialization in development
if (process.env.NODE_ENV === "development") {
  initializeApp();
}