// client/src/components/property/PropertyCard.tsx
import React, { useState } from "react";
import { Property } from "../../services/propertyService";
import BookingModal from "../booking/BookingModal";

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleBookingSuccess = (bookingId: string) => {
    // For now, show an alert. In Phase 2, we'll redirect to booking confirmation page
    alert(
      `🎉 Booking confirmed! Your booking ID is: ${bookingId}\n\nYou will receive SMS and email confirmations shortly.`
    );
    // TODO: Redirect to booking confirmation page
  };

  return (
    <>
      <div
        className="card"
        style={{ cursor: "pointer", transition: "transform 0.2s" }}
      >
        {/* Property Image */}
        <div
          style={{ position: "relative", height: "200px", overflow: "hidden" }}
        >
          <img
            src={
              property.images[0] ||
              "https://via.placeholder.com/400x200?text=Property+Image"
            }
            alt={property.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            {property.category.icon} {property.category.name}
          </div>
        </div>

        {/* Property Details */}
        <div style={{ padding: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "0.25rem",
                color: "#111827",
              }}
            >
              {property.title}
            </h3>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              {property.city}, {property.country}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              <span>
                🛏️ {property.bedrooms} bed{property.bedrooms > 1 ? "s" : ""}
              </span>
              <span>
                🚿 {property.bathrooms} bath{property.bathrooms > 1 ? "s" : ""}
              </span>
              <span>
                👥 {property.maxGuests} guest{property.maxGuests > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* New fields: Distance and Access Time */}
          {(property.distanceFromTown || property.accessTime) && (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              {property.distanceFromTown && (
                <span>📍 {property.distanceFromTown}</span>
              )}
              {property.accessTime && <span>🕒 {property.accessTime}</span>}
            </div>
          )}

          {/* Other units available */}
          {property.otherUnits && (
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
                fontStyle: "italic",
              }}
            >
              📋 {property.otherUnits}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                ${property.pricePerNight}
              </span>
              <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                {" "}
                / night
              </span>
            </div>
            {property.avgRating && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <span style={{ color: "#fbbf24" }}>⭐</span>
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {property.avgRating} ({property.totalReviews})
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: "0.75rem" }}>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: "1.4em",
                maxHeight: "2.8em",
              }}
            >
              {property.description}
            </p>
          </div>

          <div style={{ marginTop: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Hosted by {property.host.firstName} {property.host.lastName}
            </p>
          </div>

          {/* Book Now Button */}
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <button
              style={{
                width: "100%",
                backgroundColor: "#2563eb",
                color: "white",
                padding: "0.75rem 1rem",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
              }}
              onClick={() => setIsBookingModalOpen(true)}
            >
              📅 Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        property={property}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />
    </>
  );
};

export default PropertyCard;
