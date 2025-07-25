// server/src/routes/bookings.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { notificationService } from "../services/notificationService";

const router = express.Router();
const prisma = new PrismaClient();

// Create anonymous booking (no auth required)
router.post("/book", async (req, res) => {
  console.log("🎯 Booking request received!");
  console.log("📝 Request body:", req.body);

  try {
    // Extract data from request body (matching frontend field names)
    const {
      propertyId,
      checkIn,
      checkOut,
      guestCount,
      guestFirstName,
      guestLastName,
      guestEmail,
      guestPhone,
      specialRequests,
    } = req.body;

    // Validation
    if (
      !propertyId ||
      !checkIn ||
      !checkOut ||
      !guestCount ||
      !guestFirstName ||
      !guestLastName ||
      !guestEmail ||
      !guestPhone
    ) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "propertyId",
          "checkIn",
          "checkOut",
          "guestCount",
          "guestFirstName",
          "guestLastName",
          "guestEmail",
          "guestPhone",
        ],
        received: Object.keys(req.body),
      });
    }

    // Fetch property with host details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            name: true,
            icon: true,
          },
        },
      },
    });

    if (!property) {
      console.log("❌ Property not found:", propertyId);
      return res.status(404).json({ error: "Property not found" });
    }

    console.log("✅ Property found:", property.title);

    // Date validation
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time for date comparison

    if (checkInDate < now) {
      return res
        .status(400)
        .json({ error: "Check-in date cannot be in the past" });
    }

    if (checkOutDate <= checkInDate) {
      return res
        .status(400)
        .json({ error: "Check-out date must be after check-in date" });
    }

    // Check for conflicting bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        AND: [
          {
            checkIn: {
              lt: checkOutDate, // Existing booking starts before new booking ends
            },
          },
          {
            checkOut: {
              gt: checkInDate, // Existing booking ends after new booking starts
            },
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      console.log("❌ Property not available for selected dates");
      return res.status(400).json({
        error: "Property is not available for the selected dates",
      });
    }

    // Calculate total price
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * property.pricePerNight;

    console.log("💰 Price calculation:", { nights, totalPrice });

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        propertyId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: parseInt(guestCount.toString()),
        guestName: `${guestFirstName} ${guestLastName}`,
        guestEmail,
        guestPhone,
        specialRequests: specialRequests || null,
        totalPrice,
        status: "PENDING",
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            country: true,
            hostContact: true,
            pinLocation: true,
            images: true,
            host: {
              select: {
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

    console.log("✅ Booking created successfully:", booking.id);

    // Send notifications
    try {
      console.log("📧 Sending notifications...");

      // Prepare notification data
      const notificationData = {
        booking: {
          ...booking,
          guestFirstName,
          guestLastName,
          nights,
        },
        property: booking.property,
        host: booking.property.host,
      };

      // Send guest confirmation (email + SMS)
      if (guestEmail) {
        await notificationService.sendBookingConfirmation(notificationData);
        console.log("✅ Guest confirmation sent to:", guestEmail);
      }

      // Send host notification (email + SMS)
      if (booking.property.host.email) {
        await notificationService.sendNewBookingAlert(notificationData);
        console.log(
          "✅ Host notification sent to:",
          booking.property.host.email
        );
      }

      console.log("✅ All notifications sent successfully");
    } catch (notificationError) {
      console.error("❌ Notification error:", notificationError);
      // Don't fail the booking if notifications fail
      console.log("⚠️ Booking successful but notifications failed");
    }

    // Return booking details
    res.status(201).json({
      message: "Booking created successfully!",
      booking: {
        id: booking.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        status: booking.status,
        property: {
          title: booking.property.title,
          address: booking.property.address,
          city: booking.property.city,
          country: booking.property.country,
          // These are now revealed after booking
          hostContact: booking.property.hostContact,
          pinLocation: booking.property.pinLocation,
          host: {
            name: `${booking.property.host.firstName} ${booking.property.host.lastName}`,
            phone: booking.property.host.phone,
            email: booking.property.host.email,
          },
        },
      },
      // Additional info for confirmation page
      confirmationDetails: {
        bookingReference: booking.id,
        guestName: booking.guestName,
        checkInDate: checkInDate.toLocaleDateString(),
        checkOutDate: checkOutDate.toLocaleDateString(),
        nights: nights,
        totalGuests: booking.guests,
        totalAmount: totalPrice,
        propertyName: booking.property.title,
        propertyLocation: `${booking.property.city}, ${booking.property.country}`,
        hostName: `${booking.property.host.firstName} ${booking.property.host.lastName}`,
        hostContact:
          booking.property.host.phone || booking.property.hostContact,
        pinLocation: booking.property.pinLocation,
      },
    });
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({
      error: "Failed to create booking",
      details: error.message,
    });
  }
});

// Get booking by ID (no auth required - booking ID serves as access token)
router.get("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            country: true,
            hostContact: true,
            pinLocation: true,
            images: true,
            pricePerNight: true,
            bedrooms: true,
            bathrooms: true,
            maxGuests: true,
            amenities: true,
            host: {
              select: {
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

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Calculate nights
    const nights = Math.ceil(
      (new Date(booking.checkOut).getTime() -
        new Date(booking.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    res.json({
      booking: {
        ...booking,
        nights,
        property: {
          ...booking.property,
          host: {
            name: `${booking.property.host.firstName} ${booking.property.host.lastName}`,
            ...booking.property.host,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// Get all bookings for admin (requires auth)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, propertyId, hostId } = req.query;

    // Build filter conditions
    const where: any = {};
    if (status) where.status = status;
    if (propertyId) where.propertyId = propertyId;
    if (hostId) where.property = { hostId };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            pricePerNight: true,
            host: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate summary statistics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + booking.totalPrice,
      0
    );
    const bookingsByStatus = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      bookings,
      summary: {
        totalBookings,
        totalRevenue,
        bookingsByStatus,
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Update booking status (admin/host only)
router.put("/:bookingId/status", authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    // Validate status
    const validStatuses = ["CONFIRMED", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    // Get booking with property details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            hostId: true,
            title: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user is the host or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (booking.property.hostId !== userId && user?.role !== "ADMIN") {
      return res.status(403).json({
        error:
          "Unauthorized. Only the property host or admin can update booking status.",
      });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        property: {
          select: {
            title: true,
            host: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    console.log(`✅ Booking ${bookingId} status updated to ${status}`);

    res.json({
      message: `Booking ${status.toLowerCase()} successfully`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

// Get bookings for a specific property
router.get("/property/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status } = req.query;

    const where: any = { propertyId };
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        checkIn: "asc",
      },
    });

    res.json({ bookings });
  } catch (error) {
    console.error("Get property bookings error:", error);
    res.status(500).json({ error: "Failed to fetch property bookings" });
  }
});

export default router;
