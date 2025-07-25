// client/src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import Header from "../components/common/Header";
import PropertyCard from "../components/property/PropertyCard";
import { propertyService, Property } from "../services/propertyService";

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestCount, setGuestCount] = useState(1);

  // Fetch properties when component mounts
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        // First, make sure categories are seeded
        await propertyService.seedCategories();
        // Then fetch properties
        const fetchedProperties = await propertyService.getProperties();
        setProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!searchLocation.trim()) {
      alert("Please enter a location to search");
      return;
    }

    if (!checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates");
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      alert("Check-out date must be after check-in date");
      return;
    }

    try {
      setLoading(true);
      const searchResults = await propertyService.searchProperties({
        city: searchLocation,
        country: searchLocation,
        maxGuests: guestCount,
      });
      setProperties(searchResults);
    } catch (error) {
      console.error("Error searching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold" style={{ marginBottom: "1.5rem" }}>
            Find Your Perfect
            <span style={{ color: "#fbbf24" }}> Home Away From Home</span>
          </h1>
          <p
            style={{ fontSize: "1.25rem", marginBottom: "2rem", opacity: 0.9 }}
          >
            Book Airbnb, Hotels, Villas, Bungalows & Attractions across Kenya
          </p>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-grid">
              <div className="form-group">
                <label className="form-label">Town/City</label>
                <input
                  type="text"
                  placeholder="Enter town or city"
                  className="form-input"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate || new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Guests</label>
                <select
                  className="form-input"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                >
                  <option value={1}>1 guest</option>
                  <option value={2}>2 guests</option>
                  <option value={3}>3 guests</option>
                  <option value={4}>4 guests</option>
                  <option value={5}>5 guests</option>
                  <option value={6}>6+ guests</option>
                </select>
              </div>
            </div>
            <button className="search-button" onClick={handleSearch}>
              🔍 Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ padding: "2rem 1rem", backgroundColor: "#f9fafb" }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                color: "#111827",
              }}
            >
              Browse by Category
            </h2>
            <p style={{ fontSize: "1rem", color: "#6b7280" }}>
              Choose from our wide range of accommodations and experiences
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              { name: "Airbnb", icon: "🏠", desc: "Home rentals" },
              { name: "Hotels", icon: "🏨", desc: "Hotel accommodations" },
              { name: "Villas", icon: "🏡", desc: "Luxury villas" },
              { name: "Bungalow", icon: "🏘️", desc: "Cozy bungalows" },
              { name: "Attractions", icon: "🎯", desc: "Tourist attractions" },
            ].map((category) => (
              <div
                key={category.name}
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  textAlign: "center",
                  cursor: "pointer",
                  border: "1px solid #e5e7eb",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                  {category.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    marginBottom: "0.25rem",
                    color: "#111827",
                  }}
                >
                  {category.name}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {category.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section style={{ padding: "4rem 1rem" }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "#111827",
              }}
            >
              Featured Properties
            </h2>
            <p style={{ fontSize: "1.125rem", color: "#6b7280" }}>
              Explore our handpicked selection of amazing places to stay
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
              <p style={{ color: "#6b7280" }}>Loading amazing properties...</p>
            </div>
          )}

          {/* Properties Grid */}
          {!loading && properties.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "2rem",
              }}
            >
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {/* No Properties Message */}
          {!loading && properties.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏡</div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "1rem",
                  color: "#111827",
                }}
              >
                No properties found
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
                {searchLocation
                  ? `No properties found in "${searchLocation}". Try a different location.`
                  : "No properties available at the moment. Check back later!"}
              </p>
              <button
                className="search-button"
                onClick={() => {
                  setSearchLocation("");
                  propertyService.getProperties().then(setProperties);
                }}
              >
                View All Properties
              </button>
            </div>
          )}

          {/* Connection Status */}
          <div
            style={{ textAlign: "center", marginTop: "2rem", padding: "1rem" }}
          >
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {properties.length > 0
                ? `✅ Showing ${properties.length} available properties`
                : "🔍 Search for properties by location and dates"}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginTop: "0.5rem",
              }}
            >
              No signup required - Browse and book instantly!
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="features-section"
        style={{ backgroundColor: "#f9fafb" }}
      >
        <div className="max-w-7xl mx-auto">
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "#111827",
              }}
            >
              Why Choose Homelandbooking.com?
            </h2>
            <p style={{ fontSize: "1.125rem", color: "#6b7280" }}>
              Your trusted platform for home rentals and accommodations in Kenya
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏖️</div>
              <h3 className="feature-title">Unique Locations</h3>
              <p className="feature-description">
                From beachfront villas to mountain cabins, find your perfect
                getaway
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3 className="feature-title">Verified Reviews</h3>
              <p className="feature-description">
                All properties are reviewed by real guests for your peace of
                mind
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure Booking</h3>
              <p className="feature-description">
                Safe and secure payment processing for worry-free bookings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="max-w-7xl mx-auto">
          <p>&copy; 2025 Homelandbooking.com. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
