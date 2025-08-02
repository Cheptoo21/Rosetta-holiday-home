// server/src/index.js - Pure JavaScript (no TypeScript)
const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("🚀 Starting Homeland Booking - JavaScript Mode");
console.log("🌐 Environment:", process.env.NODE_ENV || "development");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://rosetta-holiday-home.vercel.app",
      "https://rosetta-holiday-home.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Basic routes
app.get("/", (req, res) => {
  console.log("📨 Request received on /");
  res.json({
    message: "🏠 Homeland Booking API - JavaScript Mode",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (req, res) => {
  console.log("📨 Health check request");
  res.json({
    status: "OK",
    message: "Homeland Booking API is healthy",
    timestamp: new Date().toISOString(),
    mode: "javascript",
  });
});

app.get("/api/test", (req, res) => {
  console.log("📨 Test endpoint hit");
  res.json({
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
  });
});

// Basic auth endpoints for testing
app.post("/api/auth/login", (req, res) => {
  console.log("📨 Login attempt:", req.body?.email);
  res.json({
    message: "Login endpoint reached",
    status: "auth_system_needed",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/auth/register", (req, res) => {
  console.log("📨 Registration attempt:", req.body?.email);
  res.json({
    message: "Registration endpoint reached",
    status: "auth_system_needed",
    timestamp: new Date().toISOString(),
  });
});

// Server startup - CRITICAL Railway binding
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

console.log(`🔧 Attempting to start server on ${HOST}:${PORT}`);

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ JavaScript server successfully running on ${HOST}:${PORT}`);
  console.log(`🌐 Server bound to all network interfaces`);
  console.log(`📡 Ready to handle HTTP requests`);
  console.log(
    `🔗 Live URL: https://rosetta-holiday-home-production.up.railway.app`
  );
});

server.on("error", (error) => {
  console.error("💥 Server error:", error);
});

server.on("listening", () => {
  console.log("🎯 Server listening event fired - Railway should now respond");
});

// Keep alive
setInterval(() => {
  console.log("❤️ Server heartbeat - still running", new Date().toISOString());
}, 60000);

module.exports = app;
