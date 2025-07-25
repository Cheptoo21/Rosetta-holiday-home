// server/src/routes/categories.ts
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Seed categories (for development)
router.get("/seed", async (req, res) => {
  try {
    const categories = [
      {
        name: "Airbnb",
        description: "Home rentals and private accommodations",
        icon: "🏠",
      },
      {
        name: "Hotels",
        description: "Professional hotel accommodations",
        icon: "🏨",
      },
      {
        name: "Villas",
        description: "Luxury villa rentals",
        icon: "🏡",
      },
      {
        name: "Bungalow",
        description: "Cozy bungalow accommodations",
        icon: "🏘️",
      },
      {
        name: "Attractions",
        description: "Tourist attractions and experiences",
        icon: "🎯",
      },
    ];

    // Use upsert to avoid duplicates
    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: category,
        create: category,
      });
    }

    const allCategories = await prisma.category.findMany();
    res.json({
      message: "Categories seeded successfully",
      categories: allCategories,
    });
  } catch (error) {
    console.error("Seed categories error:", error);
    res.status(500).json({ error: "Failed to seed categories" });
  }
});

export default router;
