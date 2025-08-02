// index.js - Entry point for Railway deployment
console.log("🚀 Starting Homeland Booking server...");

// Load environment variables first
require("dotenv").config();

// Register TSX to handle TypeScript files
try {
  require("tsx/dist/node").register();
  console.log("✅ TypeScript support loaded");
} catch (error) {
  console.error("❌ Error loading TypeScript support:", error);
  process.exit(1);
}

// Load and start your real application
try {
  require("./src/index.ts");
  console.log("✅ Application loaded from src/index.ts");
} catch (error) {
  console.error("❌ Error starting application:", error);
  console.error("Make sure src/index.ts exists and is valid");
  process.exit(1);
}
