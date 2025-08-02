// index.js - Railway entry point
console.log("🚀 Starting Homeland Booking server...");

require("dotenv").config();

try {
  require("tsx/dist/node").register();
  require("./src/index.ts");
  console.log("✅ Application loaded successfully");
} catch (error) {
  console.error("❌ Error starting application:", error);
  process.exit(1);
}
