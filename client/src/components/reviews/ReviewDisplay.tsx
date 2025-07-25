// client/src/components/reviews/ReviewDisplay.tsx
import React, { useState, useEffect } from "react";
import { reviewService } from "../../services/reviewService";
import { authService } from "../../services/authService";

interface Review {
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

interface ReviewSummary {
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

interface ReviewDisplayProps {
  propertyId: string;
  showWriteReview?: boolean;
  onWriteReview?: () => void;
}

const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  propertyId,
  showWriteReview = false,
  onWriteReview,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest" | "helpful"
  >("newest");
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    new Set()
  );
  const [userHelpfulness, setUserHelpfulness] = useState<{
    [key: string]: boolean;
  }>({});

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    fetchReviews();
  }, [propertyId, page, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getPropertyReviews(propertyId, {
        page,
        limit: 10,
        sort: sortBy,
      });

      setReviews(response.reviews);
      setSummary(response.summary);
      setTotalPages(response.pagination.totalPages);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setLoading(false);
    }
  };

  const handleHelpfulClick = async (reviewId: string, isHelpful: boolean) => {
    if (!isAuthenticated) {
      alert("Please login to vote on review helpfulness");
      return;
    }

    try {
      await reviewService.markReviewHelpful(reviewId, isHelpful);

      // Update local state
      setUserHelpfulness((prev) => ({
        ...prev,
        [reviewId]: isHelpful,
      }));

      // Update review counts
      setReviews((prev) =>
        prev.map((review) => {
          if (review.id === reviewId) {
            return {
              ...review,
              helpfulCount: isHelpful
                ? review.helpfulCount +
                  (userHelpfulness[reviewId] === true ? 0 : 1)
                : review.helpfulCount -
                  (userHelpfulness[reviewId] === true ? 1 : 0),
              notHelpfulCount: !isHelpful
                ? review.notHelpfulCount +
                  (userHelpfulness[reviewId] === false ? 0 : 1)
                : review.notHelpfulCount -
                  (userHelpfulness[reviewId] === false ? 1 : 0),
            };
          }
          return review;
        })
      );
    } catch (error) {
      console.error("Failed to mark review as helpful:", error);
    }
  };

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    return (
      <div className={`flex items-center ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderCategoryRatings = () => {
    if (!summary) return null;

    const categories = [
      {
        key: "cleanliness",
        label: "Cleanliness",
        value: summary.categoryRatings.cleanliness,
      },
      {
        key: "accuracy",
        label: "Accuracy",
        value: summary.categoryRatings.accuracy,
      },
      {
        key: "communication",
        label: "Communication",
        value: summary.categoryRatings.communication,
      },
      {
        key: "location",
        label: "Location",
        value: summary.categoryRatings.location,
      },
      {
        key: "check-in",
        label: "Check-in",
        value: summary.categoryRatings.checkin,
      },
      { key: "value", label: "Value", value: summary.categoryRatings.value },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {categories.map((category) => (
          <div key={category.key} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {category.label}
            </span>
            <div className="flex items-center">
              {renderStars(category.value, "sm")}
              <span className="ml-2 text-sm text-gray-600">
                {category.value.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReviewImages = (images: string[]) => {
    if (!images || images.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-3 gap-2">
        {images.slice(0, 3).map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Review image ${index + 1}`}
            className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(image, "_blank")}
          />
        ))}
        {images.length > 3 && (
          <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300">
            <span className="text-sm text-gray-600">
              +{images.length - 3} more
            </span>
          </div>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-section">
      {/* Reviews Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
          {summary && (
            <div className="flex items-center space-x-2">
              {renderStars(summary.averageRating, "lg")}
              <span className="text-lg font-semibold text-gray-700">
                {summary.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({summary.totalReviews} reviews)
              </span>
            </div>
          )}
        </div>

        {showWriteReview && (
          <button
            onClick={onWriteReview}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ✍️ Write a Review
          </button>
        )}
      </div>

      {/* Category Ratings */}
      {summary && summary.totalReviews > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
          {renderCategoryRatings()}
        </div>
      )}

      {/* Sorting */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            Showing {reviews.length} of {summary?.totalReviews} reviews
          </span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | "newest"
                  | "oldest"
                  | "highest"
                  | "lowest"
                  | "helpful"
              )
            }
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border border-gray-200 rounded-lg p-6"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {review.author.firstName.charAt(0)}
                    {review.author.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {review.author.firstName} {review.author.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {getMonthYear(review.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {renderStars(review.overallRating)}
                <p className="text-sm text-gray-600 mt-1">
                  {review.stayDuration} night
                  {review.stayDuration !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Review Content */}
            <div className="mb-4">
              {review.comment && (
                <p className="text-gray-700 mb-3">
                  {expandedReviews.has(review.id) ||
                  review.comment.length <= 300
                    ? review.comment
                    : `${review.comment.substring(0, 300)}...`}

                  {review.comment.length > 300 && (
                    <button
                      onClick={() => toggleExpandReview(review.id)}
                      className="text-blue-600 hover:text-blue-800 ml-2 text-sm"
                    >
                      {expandedReviews.has(review.id)
                        ? "Show less"
                        : "Show more"}
                    </button>
                  )}
                </p>
              )}

              {/* Review Images */}
              {renderReviewImages(review.images)}

              {/* Travel Type & Guest Count */}
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                {review.travelType && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {review.travelType}
                  </span>
                )}
                {review.guestCount && (
                  <span>
                    {review.guestCount} guest
                    {review.guestCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Host Response */}
            {review.response && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">
                      {review.response.host.firstName.charAt(0)}
                      {review.response.host.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Response from {review.response.host.firstName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(review.response.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {review.response.message}
                </p>
              </div>
            )}

            {/* Helpfulness */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleHelpfulClick(review.id, true)}
                  className={`flex items-center space-x-1 text-sm ${
                    userHelpfulness[review.id] === true
                      ? "text-green-600"
                      : "text-gray-600 hover:text-green-600"
                  }`}
                >
                  <span>👍</span>
                  <span>Helpful ({review.helpfulCount})</span>
                </button>
                <button
                  onClick={() => handleHelpfulClick(review.id, false)}
                  className={`flex items-center space-x-1 text-sm ${
                    userHelpfulness[review.id] === false
                      ? "text-red-600"
                      : "text-gray-600 hover:text-red-600"
                  }`}
                >
                  <span>👎</span>
                  <span>Not helpful ({review.notHelpfulCount})</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Stayed in {formatDate(review.booking.checkIn)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 border rounded-md ${
                    page === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {reviews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-600">
            Be the first to share your experience at this property.
          </p>
          {showWriteReview && (
            <button
              onClick={onWriteReview}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write the First Review
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewDisplay;
