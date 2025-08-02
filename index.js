// index.js - Railway entry point
console.log("🚀 Starting Homeland Booking server...");

// Load environment variables
require("dotenv").config();

// Check if we're in production or development
const isProduction = process.env.NODE_ENV === "production";
console.log("Environment:", isProduction ? "Production" : "Development");

// Try to load TypeScript support
try {
  console.log("Loading TypeScript support...");
  require("tsx/dist/node").register();
  console.log("✅ TypeScript support loaded");
} catch (error) {
  console.log("⚠️ tsx not available, trying ts-node...");
  try {
    require("ts-node").register({
      transpileOnly: true,
    });
    console.log("✅ ts-node loaded");
  } catch (tsError) {
    console.error("❌ No TypeScript support available");
    console.error("Make sure tsx or ts-node is installed");
    process.exit(1);
  }
}

// Load your main application
try {
  console.log("Loading application from src/index.ts...");
  require("./src/index.ts");
  console.log("✅ Application started successfully");
} catch (error) {
  console.error("❌ Failed to start application:", error.message);
  console.error("Stack trace:", error.stack);

  // Fallback: try a basic Express server
  console.log("🔄 Starting fallback server...");
  const express = require("express");
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      message: "Homeland Booking API - Fallback Mode",
      error: "TypeScript application failed to load",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ERROR",
      message: "Server running in fallback mode",
      timestamp: new Date().toISOString(),
    });
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🆘 Fallback server running on port ${PORT}`);
  });
}
