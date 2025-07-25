// client/src/pages/CreateProperty.tsx
import React, { useState, useEffect } from "react";
import Header from "../components/common/Header";
import { authService } from "../services/authService";
import { propertyService } from "../services/propertyService";
import api from "../services/api";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

const CreateProperty: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    country: "Kenya",
    pricePerNight: "",
    maxGuests: "",
    bedrooms: "",
    bathrooms: "",
    categoryId: "",
    amenities: "",
    images: "",
    distanceFromTown: "",
    accessTime: "",
    otherUnits: "",
  });

  // Check if user is authenticated and redirect if not
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    // Load categories
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await propertyService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
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
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (
        !formData.title ||
        !formData.description ||
        !formData.address ||
        !formData.city ||
        !formData.pricePerNight ||
        !formData.maxGuests ||
        !formData.bedrooms ||
        !formData.bathrooms ||
        !formData.categoryId
      ) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Prepare data for API
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        pricePerNight: Number(formData.pricePerNight),
        maxGuests: Number(formData.maxGuests),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        categoryId: formData.categoryId,
        amenities: formData.amenities
          ? formData.amenities.split(",").map((a) => a.trim())
          : [],
        images: formData.images
          ? formData.images.split(",").map((img) => img.trim())
          : [],
        distanceFromTown: formData.distanceFromTown || null,
        accessTime: formData.accessTime || null,
        otherUnits: formData.otherUnits || null,
      };

      // Create property via API
      const response = await api.post("/properties", propertyData);

      setSuccess(true);

      // Show success message and redirect
      setTimeout(() => {
        alert(
          "🎉 Property created successfully! Your property is pending approval and will be visible to guests once approved."
        );
        window.location.href = "/host-dashboard";
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "3rem",
              textAlign: "center",
              maxWidth: "500px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "#059669",
              }}
            >
              Property Created Successfully!
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
              Your property has been submitted and is pending approval. You'll
              be notified once it's approved and visible to guests.
            </p>
            <button
              onClick={() => (window.location.href = "/host-dashboard")}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                padding: "0.75rem 2rem",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Header />

      <div
        style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
              color: "#111827",
            }}
          >
            List Your Property 🏠
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "1.125rem",
            }}
          >
            Share your space with travelers and start earning today
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "0.5rem",
                padding: "1rem",
                marginBottom: "2rem",
                color: "#dc2626",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#111827",
                }}
              >
                Basic Information
              </h2>

              <div style={{ display: "grid", gap: "1rem" }}>
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
                    Property Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Cozy Beachfront Villa with Ocean Views"
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
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your property, amenities, and what makes it special..."
                    required
                    rows={4}
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
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
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
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#111827",
                }}
              >
                Location
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
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
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Ocean Drive"
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
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Mombasa"
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
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
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
            </div>

            {/* Property Details */}
            <div style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#111827",
                }}
              >
                Property Details
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "1rem",
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
                    Price per Night ($) *
                  </label>
                  <input
                    type="number"
                    name="pricePerNight"
                    value={formData.pricePerNight}
                    onChange={handleInputChange}
                    placeholder="150"
                    required
                    min="1"
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
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleInputChange}
                    placeholder="4"
                    required
                    min="1"
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
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="2"
                    required
                    min="1"
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
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="2"
                    required
                    min="1"
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
            </div>

            {/* Additional Information */}
            <div style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#111827",
                }}
              >
                Additional Information
              </h2>

              <div style={{ display: "grid", gap: "1rem" }}>
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
                    Amenities (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleInputChange}
                    placeholder="WiFi, Pool, Kitchen, Parking, Air Conditioning"
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
                    Image URLs (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="images"
                    value={formData.images}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
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
                      Distance from Town
                    </label>
                    <input
                      type="text"
                      name="distanceFromTown"
                      value={formData.distanceFromTown}
                      onChange={handleInputChange}
                      placeholder="e.g., 2 km from town center"
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
                      Access Time
                    </label>
                    <input
                      type="text"
                      name="accessTime"
                      value={formData.accessTime}
                      onChange={handleInputChange}
                      placeholder="e.g., 5 mins drive"
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
                    Other Available Units
                  </label>
                  <input
                    type="text"
                    name="otherUnits"
                    value={formData.otherUnits}
                    onChange={handleInputChange}
                    placeholder="e.g., Two additional 1-bedroom units available"
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
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: "center" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#9ca3af" : "#2563eb",
                  color: "white",
                  padding: "1rem 3rem",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor = "#2563eb";
                }}
              >
                {loading ? "🔄 Creating Property..." : "🏠 List My Property"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Your property will be reviewed and approved before appearing to
                guests
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProperty;
