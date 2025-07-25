// client/src/components/reviews/ReviewForm.tsx
import React, { useState } from "react";
import { reviewService } from "../../services/reviewService";

interface ReviewFormProps {
  bookingId: string;
  propertyTitle: string;
  hostName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ReviewFormData {
  overallRating: number;
  cleanlinessRating: number;
  accuracyRating: number;
  communicationRating: number;
  locationRating: number;
  checkinRating: number;
  valueRating: number;
  comment: string;
  images: string[];
  travelType: string;
  guestCount: number;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  bookingId,
  propertyTitle,
  hostName,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    overallRating: 0,
    cleanlinessRating: 0,
    accuracyRating: 0,
    communicationRating: 0,
    locationRating: 0,
    checkinRating: 0,
    valueRating: 0,
    comment: "",
    images: [],
    travelType: "",
    guestCount: 1,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [imageInput, setImageInput] = useState("");

  const categories = [
    {
      key: "cleanlinessRating",
      label: "Cleanliness",
      description: "How clean was the property?",
    },
    {
      key: "accuracyRating",
      label: "Accuracy",
      description: "How accurate was the listing description?",
    },
    {
      key: "communicationRating",
      label: "Communication",
      description: "How well did the host communicate?",
    },
    {
      key: "locationRating",
      label: "Location",
      description: "How was the location?",
    },
    {
      key: "checkinRating",
      label: "Check-in",
      description: "How smooth was the check-in process?",
    },
    {
      key: "valueRating",
      label: "Value",
      description: "How was the value for money?",
    },
  ];

  const travelTypes = [
    "Business",
    "Leisure",
    "Family",
    "Friends",
    "Solo",
    "Couples",
    "Other",
  ];

  const handleRatingChange = (category: string, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      [category]: rating,
    }));

    // Clear error when rating is set
    if (errors[category]) {
      setErrors((prev) => ({
        ...prev,
        [category]: "",
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guestCount" ? parseInt(value) || 1 : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAddImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()],
      }));
      setImageInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Overall rating is required
    if (formData.overallRating === 0) {
      newErrors.overallRating = "Overall rating is required";
    }

    // At least one category rating is required
    const categoryRatings = categories.map(
      (cat) => formData[cat.key as keyof ReviewFormData]
    );
    if (categoryRatings.every((rating) => rating === 0)) {
      newErrors.categories = "Please rate at least one category";
    }

    // Comment length validation
    if (formData.comment.length > 2000) {
      newErrors.comment = "Comment must be less than 2000 characters";
    }

    // Guest count validation
    if (formData.guestCount < 1) {
      newErrors.guestCount = "Guest count must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await reviewService.createReview(bookingId, formData);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setErrors({
        general: error.message || "Failed to submit review. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (
    value: number,
    onChange: (rating: number) => void,
    label: string,
    description?: string
  ) => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className={`text-2xl transition-colors ${
                  star <= value
                    ? "text-yellow-400 hover:text-yellow-500"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {value > 0 ? `${value}/5` : "Not rated"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Write a Review
        </h2>
        <p className="text-gray-600">
          Share your experience at <strong>{propertyTitle}</strong> with{" "}
          {hostName}
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <p className="text-sm text-red-700">⚠️ {errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Overall Rating *
          </h3>
          {renderStarRating(
            formData.overallRating,
            (rating) => handleRatingChange("overallRating", rating),
            "How would you rate your overall experience?"
          )}
          {errors.overallRating && (
            <p className="text-sm text-red-600 mt-1">{errors.overallRating}</p>
          )}
        </div>

        {/* Category Ratings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Ratings
          </h3>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.key}>
                {renderStarRating(
                  formData[category.key as keyof ReviewFormData] as number,
                  (rating) => handleRatingChange(category.key, rating),
                  category.label,
                  category.description
                )}
              </div>
            ))}
          </div>
          {errors.categories && (
            <p className="text-sm text-red-600 mt-1">{errors.categories}</p>
          )}
        </div>

        {/* Written Review */}
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tell us about your experience
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={6}
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Share details about your stay, what you loved, and any suggestions for improvement..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {formData.comment.length}/2000 characters
            </span>
          </div>
          {errors.comment && (
            <p className="text-sm text-red-600 mt-1">{errors.comment}</p>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos (Optional)
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="Paste image URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Add photos to help future guests and give feedback to the
            host
          </p>
        </div>

        {/* Travel Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="travelType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Travel Type
            </label>
            <select
              id="travelType"
              name="travelType"
              value={formData.travelType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select travel type</option>
              {travelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="guestCount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Number of Guests
            </label>
            <input
              id="guestCount"
              name="guestCount"
              type="number"
              min="1"
              value={formData.guestCount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.guestCount && (
              <p className="text-sm text-red-600 mt-1">{errors.guestCount}</p>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">Review Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be honest and constructive in your feedback</li>
            <li>• Focus on your actual experience at the property</li>
            <li>• Avoid personal attacks or inappropriate language</li>
            <li>• Include specific details that would help future guests</li>
            <li>• Reviews are public and will be visible to other users</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? "🔄 Submitting..." : "📝 Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
