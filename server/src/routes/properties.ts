// server/src/routes/properties.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Get all properties (public - no auth required)
router.get("/", async (req, res) => {
  try {
    const {
      city,
      country,
      minPrice,
      maxPrice,
      maxGuests,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build filter conditions
    const where: any = {
      isActive: true,
      //approvalStatus: "APPROVED", // Only show approved properties
    };

    if (city) where.city = { contains: city as string, mode: "insensitive" };
    if (country)
      where.country = { contains: country as string, mode: "insensitive" };
    if (minPrice)
      where.pricePerNight = { ...where.pricePerNight, gte: Number(minPrice) };
    if (maxPrice)
      where.pricePerNight = { ...where.pricePerNight, lte: Number(maxPrice) };
    if (maxGuests) where.maxGuests = { gte: Number(maxGuests) };
    if (category) {
      where.category = {
        name: { contains: category as string, mode: "insensitive" },
      };
    }

    // Get properties with host info (but hide contact details)
    const properties = await prisma.property.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            // hostContact is excluded - only available after booking
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    });

    // Hide sensitive information for public viewing
    const publicProperties = properties.map((property) => ({
      ...property,
      hostContact: undefined, // Hide until booking
      pinLocation: undefined, // Hide until booking
    }));

    // Get total count for pagination
    const total = await prisma.property.count({ where });

    res.json({
      properties: publicProperties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// Get single property by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
          },
        },
        reviews: {
          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Calculate average rating
    const avgRating =
      property.reviews.length > 0
        ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
          property.reviews.length
        : 0;

    res.json({
      ...property,
      avgRating: Number(avgRating.toFixed(1)),
      totalReviews: property.reviews.length,
    });
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

// Create new property (requires auth)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      country,
      latitude,
      longitude,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      images,
      categoryId,
    } = req.body;

    // Validation
    if (
      !title ||
      !description ||
      !address ||
      !city ||
      !country ||
      !pricePerNight ||
      !maxGuests ||
      !bedrooms ||
      !bathrooms ||
      !categoryId
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: title, description, address, city, country, pricePerNight, maxGuests, bedrooms, bathrooms, categoryId",
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        title,
        description,
        address,
        city,
        country,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        pricePerNight: Number(pricePerNight),
        maxGuests: Number(maxGuests),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        amenities: amenities || [],
        images: images || [],
        approvalStatus: "APPROVED",
        hostId: req.user.userId,
        categoryId,
      },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // Update user to host status
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { isHost: true },
    });

    res.status(201).json({
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// Update property (requires auth & ownership)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if property exists and user owns it
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (existingProperty.hostId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this property" });
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    res.json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// Delete property (requires auth & ownership)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if property exists and user owns it
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (existingProperty.hostId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this property" });
    }

    // Soft delete (set isActive to false)
    await prisma.property.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// Get user's properties (requires auth)
router.get("/user/my-properties", authMiddleware, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        hostId: req.user.userId,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ properties });
  } catch (error) {
    console.error("Get user properties error:", error);
    res.status(500).json({ error: "Failed to fetch user properties" });
  }
});

// Admin approve property (requires auth)
router.put("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id },
      data: { approvalStatus: "APPROVED" },
    });

    res.json({
      message: "Property approved successfully",
      property: {
        id: property.id,
        title: property.title,
        approvalStatus: property.approvalStatus,
      },
    });
  } catch (error) {
    console.error("Approve property error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Property not found" });
    }
    res.status(500).json({ error: "Failed to approve property" });
  }
});

export default router;
