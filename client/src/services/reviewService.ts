// client/src/services/reviewService.ts
import api from "./api";

export interface ReviewData {
  overallRating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  checkinRating?: number;
  valueRating?: number;
  comment?: string;
  images?: string[];
  travelType?: string;
  guestCount?: number;
}

export interface Review {
  id: string;
  overallRating: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  checkinRating?: number;
  valueRating?: number;
  comment?: string;
  images: string[];
  travelType?: string;
  guestCount?: number;
  stayDuration?: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  response?: {
    id: string;
    message: string;
    createdAt: string;
    host: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  booking: {
    checkIn: string;
    checkOut: string;
    guests: number;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  categoryRatings: {
    cleanliness: number;
    accuracy: number;
    communication: number;
    location: number;
    checkin: number;
    value: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: ReviewSummary;
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "highest" | "lowest" | "helpful";
}

class ReviewService {
  // Get reviews for a specific property
  async getPropertyReviews(
    propertyId: string,
    filters: ReviewFilters = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sort) params.append("sort", filters.sort);

      const response = await api.get(
        `/reviews/property/${propertyId}?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to fetch reviews");
    }
  }

  // Create a new review
  async createReview(
    bookingId: string,
    reviewData: ReviewData
  ): Promise<Review> {
    try {
      const response = await api.post("/reviews/create", {
        bookingId,
        ...reviewData,
      });
      return response.data.review;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to create review");
    }
  }

  // Get user's own reviews
  async getMyReviews(filters: ReviewFilters = {}): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(
        `/reviews/my-reviews?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch your reviews"
      );
    }
  }

  // Get reviews for host's properties
  async getMyPropertyReviews(
    filters: ReviewFilters & { propertyId?: string } = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.propertyId) params.append("propertyId", filters.propertyId);

      const response = await api.get(
        `/reviews/my-property-reviews?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch property reviews"
      );
    }
  }

  // Respond to a review (for hosts)
  async respondToReview(reviewId: string, message: string): Promise<any> {
    try {
      const response = await api.post(`/reviews/${reviewId}/respond`, {
        message,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to respond to review"
      );
    }
  }

  // Mark review as helpful/not helpful
  async markReviewHelpful(reviewId: string, isHelpful: boolean): Promise<any> {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`, {
        isHelpful,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to record helpfulness vote"
      );
    }
  }

  // Get bookings eligible for review
  async getBookingsForReview(): Promise<any[]> {
    try {
      const response = await api.get("/bookings/eligible-for-review");
      return response.data.bookings;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch bookings for review"
      );
    }
  }

  // Get review statistics for a user
  async getReviewStats(userId?: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    categoryAverages: {
      cleanliness: number;
      accuracy: number;
      communication: number;
      location: number;
      checkin: number;
      value: number;
    };
  }> {
    try {
      const endpoint = userId
        ? `/reviews/stats/${userId}`
        : "/reviews/my-stats";
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch review statistics"
      );
    }
  }

  // Get trending reviews (most helpful, recent, etc.)
  async getTrendingReviews(limit: number = 10): Promise<Review[]> {
    try {
      const response = await api.get(`/reviews/trending?limit=${limit}`);
      return response.data.reviews;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch trending reviews"
      );
    }
  }

  // Search reviews by keywords
  async searchReviews(
    query: string,
    filters: ReviewFilters = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();

      params.append("q", query);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sort) params.append("sort", filters.sort);

      const response = await api.get(`/reviews/search?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to search reviews"
      );
    }
  }

  // Get review insights for hosts
  async getReviewInsights(propertyId?: string): Promise<{
    averageRating: number;
    totalReviews: number;
    recentTrends: {
      lastMonth: number;
      previousMonth: number;
      improvement: number;
    };
    commonKeywords: { word: string; count: number }[];
    categoryBreakdown: {
      cleanliness: number;
      accuracy: number;
      communication: number;
      location: number;
      checkin: number;
      value: number;
    };
    sentimentAnalysis: {
      positive: number;
      neutral: number;
      negative: number;
    };
  }> {
    try {
      const endpoint = propertyId
        ? `/reviews/insights?propertyId=${propertyId}`
        : "/reviews/insights";
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch review insights"
      );
    }
  }

  // Report a review
  async reportReview(
    reviewId: string,
    reason: string,
    details?: string
  ): Promise<void> {
    try {
      await api.post(`/reviews/${reviewId}/report`, { reason, details });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to report review");
    }
  }

  // Get review moderation queue (for admins)
  async getReviewModerationQueue(
    filters: ReviewFilters = {}
  ): Promise<ReviewsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(
        `/admin/reviews/moderation-queue?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch moderation queue"
      );
    }
  }

  // Moderate a review (for admins)
  async moderateReview(
    reviewId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<void> {
    try {
      await api.post(`/admin/reviews/${reviewId}/moderate`, { action, notes });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to moderate review"
      );
    }
  }

  // Get review analytics (for admins)
  async getReviewAnalytics(
    timeframe: "week" | "month" | "year" = "month"
  ): Promise<{
    totalReviews: number;
    averageRating: number;
    reviewGrowth: number;
    ratingDistribution: { [key: number]: number };
    topRatedProperties: any[];
    reviewsByCategory: {
      cleanliness: number;
      accuracy: number;
      communication: number;
      location: number;
      checkin: number;
      value: number;
    };
    hostPerformance: {
      hostId: string;
      hostName: string;
      averageRating: number;
      totalReviews: number;
    }[];
  }> {
    try {
      const response = await api.get(
        `/admin/reviews/analytics?timeframe=${timeframe}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch review analytics"
      );
    }
  }
}

export const reviewService = new ReviewService();
export default reviewService;
