// index.js - Simple Railway entry point (REPLACE EVERYTHING)
console.log("🚀 Starting Homeland Booking server...");
console.log("Environment:", process.env.NODE_ENV || "development");

// Load environment variables
require("dotenv").config();

// SKIP TypeScript completely - load JavaScript directly
try {
  console.log("📂 Loading JavaScript application...");
  require("./server/src/index.js"); // ← Load .js instead of .ts
  console.log("✅ Application loaded successfully");
} catch (error) {
  console.error("💥 Failed to load application:", error.message);
}
// Simple backup
