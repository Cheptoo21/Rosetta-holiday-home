// server/src/routes/host.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Get host dashboard stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Get host's properties count and stats
    const [properties, bookings] = await Promise.all([
      prisma.property.findMany({
        where: { hostId: userId },
        select: {
          id: true,
          approvalStatus: true,
          _count: {
            select: {
              bookings: {
                where: {
                  status: {
                    in: ["CONFIRMED", "COMPLETED"],
                  },
                },
              },
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          property: {
            hostId: userId,
          },
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        select: {
          totalPrice: true,
          status: true,
        },
      }),
    ]);

    // Calculate stats
    const totalProperties = properties.length;
    const approvedProperties = properties.filter(
      (p) => p.approvalStatus === "APPROVED"
    ).length;
    const pendingProperties = properties.filter(
      (p) => p.approvalStatus === "PENDING"
    ).length;
    const totalBookings = bookings.length;
    const totalEarnings = bookings
      .filter((b) => b.status === "COMPLETED")
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const stats = {
      totalProperties,
      totalBookings,
      totalEarnings,
      pendingProperties,
      approvedProperties,
    };

    res.json(stats);
  } catch (error) {
    console.error("Get host stats error:", error);
    res.status(500).json({ error: "Failed to fetch host statistics" });
  }
});

// Get host's properties
router.get("/properties", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;

    const properties = await prisma.property.findMany({
      where: { hostId: userId },
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
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ["CONFIRMED", "COMPLETED"],
                },
              },
            },
          },
        },
        bookings: {
          where: {
            status: "COMPLETED",
          },
          select: {
            totalPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add calculated fields
    const propertiesWithStats = properties.map((property) => ({
      ...property,
      totalBookings: property._count.bookings,
      totalEarnings: property.bookings.reduce(
        (sum, booking) => sum + booking.totalPrice,
        0
      ),
      bookings: undefined, // Remove bookings array from response
      _count: undefined, // Remove _count from response
    }));

    res.json({ properties: propertiesWithStats });
  } catch (error) {
    console.error("Get host properties error:", error);
    res.status(500).json({ error: "Failed to fetch host properties" });
  }
});

// Get host's bookings
router.get("/bookings", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          hostId: userId,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    res.json({ bookings });
  } catch (error) {
    console.error("Get host bookings error:", error);
    res.status(500).json({ error: "Failed to fetch host bookings" });
  }
});

// Update property
router.put("/properties/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // Verify property belongs to this host
    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        hostId: userId,
      },
    });

    if (!existingProperty) {
      return res
        .status(404)
        .json({ error: "Property not found or access denied" });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: req.body,
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

    res.json({ property: updatedProperty });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// Delete property
router.delete("/properties/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // Verify property belongs to this host
    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        hostId: userId,
      },
    });

    if (!existingProperty) {
      return res
        .status(404)
        .json({ error: "Property not found or access denied" });
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        propertyId: id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete property with active bookings. Please cancel or complete all bookings first.",
      });
    }

    await prisma.property.delete({
      where: { id },
    });

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// Toggle property active status
router.put("/properties/:id/toggle", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { isActive } = req.body;

    // Verify property belongs to this host
    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        hostId: userId,
      },
    });

    if (!existingProperty) {
      return res
        .status(404)
        .json({ error: "Property not found or access denied" });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { isActive },
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

    res.json({ property: updatedProperty });
  } catch (error) {
    console.error("Toggle property status error:", error);
    res.status(500).json({ error: "Failed to toggle property status" });
  }
});

export default router;
