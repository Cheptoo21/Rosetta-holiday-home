// server/src/routes/admin.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { notificationService } from "../services/notificationService";

const router = express.Router();
const prisma = new PrismaClient();

// Admin authentication middleware
const adminAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. Admin token required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // For now, just check if user exists (bypassing role check)
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!admin) {
      return res.status(403).json({ error: "Access denied. User not found." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid admin token" });
  }
};

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find admin user (for now, any user can be admin)
    const admin = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
      },
    });

    if (!admin) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: admin.id, email: admin.email },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    // Return admin data without password
    const { password: _, ...adminData } = admin;

    res.json({
      message: "Admin login successful",
      admin: { ...adminData, role: "ADMIN" }, // Add role for frontend
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Admin login failed" });
  }
});

// Get platform statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    // Get all stats in parallel
    const [
      totalHosts,
      totalProperties,
      totalBookings,
      pendingProperties,
      activeProperties,
      rejectedProperties,
      completedBookings,
      todayBookings,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.property.count(),
      prisma.booking.count(),
      prisma.property.count({ where: { approvalStatus: "PENDING" } }),
      prisma.property.count({
        where: { approvalStatus: "APPROVED", isActive: true },
      }),
      prisma.property.count({ where: { approvalStatus: "REJECTED" } }),
      prisma.booking.findMany({
        where: { status: "COMPLETED" },
        select: { totalPrice: true },
      }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Calculate revenue
    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + booking.totalPrice,
      0
    );

    // Calculate this month's revenue
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const thisMonthBookings = await prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfMonth },
      },
      select: { totalPrice: true },
    });
    const thisMonthRevenue = thisMonthBookings.reduce(
      (sum, booking) => sum + booking.totalPrice,
      0
    );

    const stats = {
      totalHosts,
      totalProperties,
      totalBookings,
      totalRevenue,
      pendingProperties,
      activeProperties,
      rejectedProperties,
      todayBookings,
      thisMonthRevenue,
    };

    res.json(stats);
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch platform statistics" });
  }
});

// Get pending properties
router.get("/properties/pending", adminAuth, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        category: {
          select: { id: true, name: true, icon: true },
        },
      },
      orderBy: { createdAt: "asc" }, // Oldest first
    });

    res.json({ properties });
  } catch (error) {
    console.error("Get pending properties error:", error);
    res.status(500).json({ error: "Failed to fetch pending properties" });
  }
});

// Get all properties with filter
router.get("/properties", adminAuth, async (req, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.approvalStatus = status;
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        category: {
          select: { id: true, name: true, icon: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ properties });
  } catch (error) {
    console.error("Get all properties error:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// Approve property
router.put("/properties/:id/approve", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id },
      data: {
        approvalStatus: "APPROVED",
        // rejectionReason: null, // Clear any previous rejection reason
      },
      include: {
        host: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    // TODO: Send notification email to host about approval
    console.log(
      `Property "${property.title}" approved for host ${property.host.email}`
    );

    // Send approval notifications (email + SMS)
    try {
      const approvalResults =
        await notificationService.sendPropertyApprovalNotification({
          hostEmail: property.host.email,
          hostPhone: property.host.phone ?? undefined,
          hostName: `${property.host.firstName} ${property.host.lastName}`,
          propertyTitle: property.title,
          status: "APPROVED",
          propertyUrl: `${process.env.CLIENT_URL}/property/${property.id}`,
        });

      console.log("📧📱 Property approval notifications sent:", {
        email: approvalResults.email,
        sms: approvalResults.sms,
      });
    } catch (notificationError) {
      console.error(
        "❌ Failed to send property approval notifications:",
        notificationError
      );
    }

    res.json({
      message: "Property approved successfully",
      property,
    });
  } catch (error) {
    console.error("Approve property error:", error);
    res.status(500).json({ error: "Failed to approve property" });
  }
});

// Reject property
router.put("/properties/:id/reject", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        approvalStatus: "APPROVED",
        //rejectionReason: rejectionReason.trim(),
      },
      include: {
        host: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    // TODO: Send notification email to host about rejection with reason
    console.log(
      `Property "${property.title}" rejected for host ${property.host.email}. Reason: ${rejectionReason}`
    );

    // Send rejection notifications (email + SMS)
    try {
      const rejectionResults =
        await notificationService.sendPropertyApprovalNotification({
          hostEmail: property.host.email,
          hostPhone: property.host.phone,
          hostName: `${property.host.firstName} ${property.host.lastName}`,
          propertyTitle: property.title,
          status: "REJECTED",
          rejectionReason,
        });

      console.log("📧📱 Property rejection notifications sent:", {
        email: rejectionResults.email,
        sms: rejectionResults.sms,
      });
    } catch (notificationError) {
      console.error(
        "❌ Failed to send property rejection notifications:",
        notificationError
      );
    }

    res.json({
      message: "Property rejected successfully",
      property,
    });
  } catch (error) {
    console.error("Reject property error:", error);
    res.status(500).json({ error: "Failed to reject property" });
  }
});

// Get all platform bookings
router.get("/bookings", adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const bookings = await prisma.booking.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            images: true,
            host: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({ bookings });
  } catch (error) {
    console.error("Get admin bookings error:", error);
    res.status(500).json({ error: "Failed to fetch platform bookings" });
  }
});

// Get all hosts
router.get("/hosts", adminAuth, async (req, res) => {
  try {
    const hosts = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ hosts });
  } catch (error) {
    console.error("Get hosts error:", error);
    res.status(500).json({ error: "Failed to fetch hosts" });
  }
});

// Admin delete property (with override)
router.delete("/properties/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check for active bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        propertyId: id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        error: `Cannot delete property with ${activeBookings.length} active booking(s)`,
        activeBookings: activeBookings.length,
      });
    }

    // Delete property
    await prisma.property.delete({ where: { id } });

    res.json({ message: "Property deleted successfully by admin" });
  } catch (error) {
    console.error("Admin delete property error:", error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// Create admin user (development/setup endpoint)
router.post("/create-admin", async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    if (existingAdmin && existingAdmin.role === "ADMIN") {
      return res
        .status(400)
        .json({ error: "Admin with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.status(201).json({
      message: "Admin user created successfully",
      admin,
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ error: "Failed to create admin user" });
  }
});

// Update booking status (admin override)
router.put("/bookings/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ error: "Invalid booking status" });
    }

    // ✅ Fix: Include host relation in your queries
    const bookings = await prisma.booking.findMany({
      include: {
        property: {
          include: {
            host: {
              // ← ADD THIS
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: "Booking status updated successfully",
      bookings,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

// Test notifications endpoint (email + SMS)
router.post("/test-notifications", adminAuth, async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Test both email and SMS
    const results = await notificationService.testNotifications(email, phone);

    res.json({
      message: "Test notifications sent",
      results: {
        email: results.email ? "Success" : "Failed",
        sms: phone ? (results.sms ? "Success" : "Failed") : "No phone provided",
      },
    });
  } catch (error) {
    console.error("Test notifications error:", error);
    res.status(500).json({ error: "Failed to send test notifications" });
  }
});

// Get notification services status
router.get("/notifications/status", adminAuth, async (req, res) => {
  try {
    const status = notificationService.getServicesStatus();
    res.json({ status });
  } catch (error) {
    console.error("Get services status error:", error);
    res.status(500).json({ error: "Failed to get services status" });
  }
});

export default router;
