// server/src/routes/reviews.ts
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { sendEmail } from "../services/emailService";

const router = express.Router();
const prisma = new PrismaClient();

// Extended Request interface for authenticated routes
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// ⭐ CREATE REVIEW
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        bookingId,
        propertyId,
        recipientId,
        overallRating,
        cleanliness,
        accuracy,
        communication,
        location,
        checkIn,
        value,
        comment,
        images = [],
      }: {
        bookingId: string;
        propertyId: string;
        recipientId: string;
        overallRating: number;
        cleanliness: number;
        accuracy: number;
        communication: number;
        location: number;
        checkIn: number;
        value: number;
        comment: string;
        images: string[];
      } = req.body;

      // Validate user can review this booking
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [
            { userId: req.user.id }, // Registered user
            { guestEmail: req.user.email }, // Anonymous booking with same email
          ],
          status: "COMPLETED", // Only completed bookings can be reviewed
        },
        include: {
          property: {
            include: {
              host: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          message: "You can only review completed bookings",
        });
      }

      // Check if review already exists
      const existingReview = await prisma.review.findUnique({
        where: { bookingId },
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this booking",
        });
      }

      // Calculate overall rating if not provided
      const calculatedOverallRating =
        overallRating ||
        (cleanliness + accuracy + communication + location + checkIn + value) /
          6;

      // Create review
      const review = await prisma.review.create({
        data: {
          authorId: req.user.id,
          recipientId,
          propertyId,
          bookingId,
          overallRating: calculatedOverallRating,
          cleanliness,
          accuracy,
          communication,
          location,
          checkIn,
          value,
          comment,
          images,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          property: {
            select: {
              title: true,
            },
          },
        },
      });

      // Send notification email to host
      try {
        await sendEmail({
          to: booking.property.host.email,
          subject: "New Review Received - Homeland Booking",
          template: "new-review-notification",
          data: {
            hostName: booking.property.host.name,
            propertyTitle: booking.property.title,
            guestName: review.author.name,
            rating: calculatedOverallRating,
            comment: comment || "No comment provided",
            reviewUrl: `${process.env.CLIENT_URL}/property/${propertyId}#reviews`,
          },
        });
      } catch (emailError) {
        console.error("Failed to send review notification email:", emailError);
      }

      res.json({
        success: true,
        message: "Review created successfully",
        data: review,
      });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create review",
      });
    }
  }
);

// 📋 GET REVIEWS FOR A PROPERTY
router.get("/property/:propertyId", async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { page = "1", limit = "10", sortBy = "newest" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Sort options
    let orderBy: any = { createdAt: "desc" }; // Default: newest first
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    if (sortBy === "highest") orderBy = { overallRating: "desc" };
    if (sortBy === "lowest") orderBy = { overallRating: "asc" };

    const [reviews, totalCount, averageRating] = await Promise.all([
      // Get reviews with pagination
      prisma.review.findMany({
        where: {
          propertyId,
          isVisible: true,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          hostResponse: {
            include: {
              host: {
                select: {
                  id: true,
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
        orderBy,
        skip: offset,
        take: limitNum,
      }),

      // Get total count for pagination
      prisma.review.count({
        where: {
          propertyId,
          isVisible: true,
        },
      }),

      // Calculate average ratings
      prisma.review.aggregate({
        where: {
          propertyId,
          isVisible: true,
        },
        _avg: {
          overallRating: true,
          cleanliness: true,
          accuracy: true,
          communication: true,
          location: true,
          checkIn: true,
          value: true,
        },
      }),
    ]);

    // Calculate rating breakdown
    const ratingBreakdown = await prisma.review.groupBy({
      by: ["overallRating"],
      where: {
        propertyId,
        isVisible: true,
      },
      _count: {
        overallRating: true,
      },
    });

    // Convert to more useful format
    const ratingCounts: { [key: number]: number } = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingBreakdown.forEach((item) => {
      const rating = Math.floor(item.overallRating);
      ratingCounts[rating] = item._count.overallRating;
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalReviews: totalCount,
          hasNext: offset + limitNum < totalCount,
          hasPrev: pageNum > 1,
        },
        averageRating: {
          overall: averageRating._avg.overallRating || 0,
          cleanliness: averageRating._avg.cleanliness || 0,
          accuracy: averageRating._avg.accuracy || 0,
          communication: averageRating._avg.communication || 0,
          location: averageRating._avg.location || 0,
          checkIn: averageRating._avg.checkIn || 0,
          value: averageRating._avg.value || 0,
        },
        ratingBreakdown: ratingCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching property reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
});

// 👤 GET REVIEWS BY USER
router.get(
  "/user/:userId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { type = "given" } = req.query;

      const whereClause =
        type === "given" ? { authorId: userId } : { recipientId: userId };

      const reviews = await prisma.review.findMany({
        where: {
          ...whereClause,
          isVisible: true,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              city: true,
              country: true,
            },
          },
          ...(type === "given" && {
            hostResponse: {
              include: {
                host: {
                  select: {
                    id: true,
                    name: true,
                    profilePicture: true,
                  },
                },
              },
            },
          }),
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user reviews",
      });
    }
  }
);

// 💬 ADD HOST RESPONSE TO REVIEW
router.post(
  "/:reviewId/response",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { response }: { response: string } = req.body;

      // Verify the review exists and user is the recipient (host)
      const review = await prisma.review.findFirst({
        where: {
          id: reviewId,
          recipientId: req.user.id,
        },
        include: {
          author: true,
          property: true,
        },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found or you are not authorized to respond",
        });
      }

      // Check if response already exists
      const existingResponse = await prisma.hostResponse.findUnique({
        where: { reviewId },
      });

      if (existingResponse) {
        return res.status(400).json({
          success: false,
          message: "You have already responded to this review",
        });
      }

      // Create host response
      const hostResponse = await prisma.hostResponse.create({
        data: {
          reviewId,
          hostId: req.user.id,
          response,
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
      });

      // Send notification email to review author
      try {
        await sendEmail({
          to: review.author.email,
          subject: "Host Response to Your Review - Homeland Booking",
          template: "review-response-notification",
          data: {
            guestName: review.author.name,
            hostName: req.user.name,
            propertyTitle: review.property.title,
            hostResponse: response,
            reviewUrl: `${process.env.CLIENT_URL}/property/${review.propertyId}#reviews`,
          },
        });
      } catch (emailError) {
        console.error(
          "Failed to send response notification email:",
          emailError
        );
      }

      res.json({
        success: true,
        message: "Response added successfully",
        data: hostResponse,
      });
    } catch (error) {
      console.error("Error adding host response:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add response",
      });
    }
  }
);

// 📊 GET HOST ANALYTICS
router.get(
  "/analytics/:hostId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { hostId } = req.params;

      // Verify user is the host or admin
      if (req.user.id !== hostId && req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const [totalReviews, averageRatings, ratingTrends, recentReviews] =
        await Promise.all([
          // Total review count
          prisma.review.count({
            where: {
              recipientId: hostId,
              isVisible: true,
            },
          }),

          // Average ratings across all categories
          prisma.review.aggregate({
            where: {
              recipientId: hostId,
              isVisible: true,
            },
            _avg: {
              overallRating: true,
              cleanliness: true,
              accuracy: true,
              communication: true,
              location: true,
              checkIn: true,
              value: true,
            },
          }),

          // Rating trends over last 6 months
          prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          AVG("overallRating") as avg_rating,
          COUNT(*) as review_count
        FROM "reviews"
        WHERE "recipientId" = ${hostId}
          AND "isVisible" = true
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month
      `,

          // Recent reviews
          prisma.review.findMany({
            where: {
              recipientId: hostId,
              isVisible: true,
            },
            include: {
              author: {
                select: {
                  name: true,
                  profilePicture: true,
                },
              },
              property: {
                select: {
                  title: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          }),
        ]);

      res.json({
        success: true,
        data: {
          totalReviews,
          averageRatings: {
            overall: averageRatings._avg.overallRating || 0,
            cleanliness: averageRatings._avg.cleanliness || 0,
            accuracy: averageRatings._avg.accuracy || 0,
            communication: averageRatings._avg.communication || 0,
            location: averageRatings._avg.location || 0,
            checkIn: averageRatings._avg.checkIn || 0,
            value: averageRatings._avg.value || 0,
          },
          ratingTrends,
          recentReviews,
        },
      });
    } catch (error) {
      console.error("Error fetching review analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
      });
    }
  }
);

// 🚨 REPORT REVIEW (Admin feature)
router.post(
  "/:reviewId/report",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { reason }: { reason: string } = req.body;

      await prisma.review.update({
        where: { id: reviewId },
        data: {
          isReported: true,
          reportReason: reason,
        },
      });

      res.json({
        success: true,
        message: "Review reported successfully",
      });
    } catch (error) {
      console.error("Error reporting review:", error);
      res.status(500).json({
        success: false,
        message: "Failed to report review",
      });
    }
  }
);

// 👑 ADMIN: MODERATE REVIEW
router.put(
  "/:reviewId/moderate",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if user is admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const { reviewId } = req.params;
      const {
        isVisible,
        moderationNote,
      }: { isVisible: boolean; moderationNote?: string } = req.body;

      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          isVisible,
          isReported: false, // Clear report flag
        },
      });

      res.json({
        success: true,
        message: "Review moderated successfully",
        data: review,
      });
    } catch (error) {
      console.error("Error moderating review:", error);
      res.status(500).json({
        success: false,
        message: "Failed to moderate review",
      });
    }
  }
);

// 🎯 GET REVIEW ELIGIBILITY
router.get(
  "/eligibility/:bookingId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;

      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [{ userId: req.user.id }, { guestEmail: req.user.email }],
        },
        include: {
          reviews: true,
          property: {
            include: {
              host: {
                select: {
                  id: true,
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const isEligible =
        booking.status === "COMPLETED" && !booking.reviews.length;
      const daysSinceCheckout = booking.checkOut
        ? Math.floor(
            (new Date().getTime() - new Date(booking.checkOut).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      res.json({
        success: true,
        data: {
          isEligible,
          hasExistingReview: booking.reviews.length > 0,
          bookingStatus: booking.status,
          daysSinceCheckout,
          property: {
            id: booking.property.id,
            title: booking.property.title,
            host: booking.property.host,
          },
        },
      });
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check eligibility",
      });
    }
  }
);

export default router;
