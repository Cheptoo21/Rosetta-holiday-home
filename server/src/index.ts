// src/index.ts
/*import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import categoryRoutes from "./routes/categories";
import bookingRoutes from "./routes/bookings";
import hostRoutes from "./routes/host";
import adminRoutes from "./routes/admin";
import reviewsRoutes from "./routes/reviews";

// Load environment variables
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
/*app.use(
  cors({
    origin: [
      "${process.env.REACT_APP_API_URL || 'http://localhost:3000'}", // for local development
      "https://rosetta-holiday-home.vercel.app", // production frontend
      "https://rosetta-holiday-home-client.vercel.app", // staging frontend
    ],
    credentials: true,
  })
);*/
/*a;pp.use(
  cors({
    origin: [
      "http://localhost:3000", // For local development
      "https://rosetta-holiday-home.vercel.app", // Production
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/host", hostRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewsRoutes);

// Simple test route
app.get("/", (req, res) => {
  res.json({
    message: "🏡 Welcome to Rosetta Holiday Home API!",
    status: "Server is running perfectly!",
    timestamp: new Date().toISOString(),
  });
});

// Health check route with database test
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "OK",
      message: "Rosetta Holiday Home API is healthy",
      database: "Connected ✅",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      database: "Disconnected ❌",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Rosetta Holiday Home server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Visit: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});*/
