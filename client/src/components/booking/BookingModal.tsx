// client/src/components/booking/BookingModal.tsx
import React, { useState } from "react";
import { Property } from "../../services/propertyService";
import { bookingService, BookingData } from "../../services/bookingService";

interface BookingModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guestCount: 1,
    guestFirstName: "",
    guestLastName: "",
    guestPhone: "",
    guestEmail: "",
    specialRequests: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceBreakdown, setPriceBreakdown] = useState<{
    nights: number;
    pricePerNight: number;
    totalPrice: number;
  } | null>(null);

  // Calculate price when dates change
  React.useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const nights = bookingService.calculateNights(
        formData.checkIn,
        formData.checkOut
      );
      const totalPrice = bookingService.calculatePrice(
        property.pricePerNight,
        formData.checkIn,
        formData.checkOut
      );

      if (nights > 0) {
        setPriceBreakdown({
          nights,
          pricePerNight: property.pricePerNight,
          totalPrice,
        });
      }
    } else {
      setPriceBreakdown(null);
    }
  }, [formData.checkIn, formData.checkOut, property.pricePerNight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate dates
      const dateError = bookingService.validateDates(
        formData.checkIn,
        formData.checkOut
      );
      if (dateError) {
        setError(dateError);
        setLoading(false);
        return;
      }

      // Validate guest count
      if (formData.guestCount > property.maxGuests) {
        setError(
          `Maximum ${property.maxGuests} guests allowed for this property`
        );
        setLoading(false);
        return;
      }

      // Create booking
      const bookingData: BookingData = {
        propertyId: property.id,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guestCount: formData.guestCount,
        guestFirstName: formData.guestFirstName,
        guestLastName: formData.guestLastName,
        guestPhone: formData.guestPhone,
        guestEmail: formData.guestEmail,
        specialRequests: formData.specialRequests || undefined,
      };

      const booking = await bookingService.createBooking(bookingData);
      onSuccess(booking.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create booking");
    } finally {
      setLoading(false);
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
      [name]: name === "guestCount" ? Number(value) : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  marginBottom: "0.5rem",
                  color: "#111827",
                }}
              >
                Book Your Stay
              </h2>
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                {property.title} • {property.city}, {property.country}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#6b7280",
                padding: "0.5rem",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1rem",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Dates */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                Check-in Date
              </label>
              <input
                type="date"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                Check-out Date
              </label>
              <input
                type="date"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleInputChange}
                min={formData.checkIn || new Date().toISOString().split("T")[0]}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
            </div>
          </div>

          {/* Guest Count */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "#374151",
              }}
            >
              Number of Guests
            </label>
            <select
              name="guestCount"
              value={formData.guestCount}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "1rem",
              }}
            >
              {Array.from({ length: property.maxGuests }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Guest{i > 0 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Guest Information */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#111827",
              }}
            >
              Guest Information
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  name="guestFirstName"
                  value={formData.guestFirstName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  name="guestLastName"
                  value={formData.guestLastName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="guestPhone"
                value={formData.guestPhone}
                onChange={handleInputChange}
                placeholder="e.g., +254 123 456 789"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}
              >
                Special Requests (Optional)
              </label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Any special requests or requirements..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Price Breakdown */}
          {priceBreakdown && (
            <div
              style={{
                backgroundColor: "#f0f9ff",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#111827",
                }}
              >
                Price Breakdown
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span>
                  ${priceBreakdown.pricePerNight} × {priceBreakdown.nights}{" "}
                  night{priceBreakdown.nights > 1 ? "s" : ""}
                </span>
                <span>${priceBreakdown.totalPrice}</span>
              </div>
              <div
                style={{
                  borderTop: "1px solid #cbd5e1",
                  paddingTop: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "600",
                }}
              >
                <span>Total</span>
                <span>${priceBreakdown.totalPrice}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !priceBreakdown}
            style={{
              width: "100%",
              backgroundColor:
                loading || !priceBreakdown ? "#9ca3af" : "#2563eb",
              color: "white",
              padding: "1rem",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading || !priceBreakdown ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading
              ? "🔄 Creating Booking..."
              : `📅 Book Now - $${priceBreakdown?.totalPrice || 0}`}
          </button>
        </form>

        {/* Footer Note */}
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            🔒 Your booking is secure. Host contact details and location will be
            provided after confirmation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
