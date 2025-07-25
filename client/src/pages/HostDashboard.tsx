// client/src/pages/HostDashboard.tsx
import React, { useState, useEffect } from "react";
import Header from "../components/common/Header";
import { authService } from "../services/authService";
import {
  hostService,
  HostStats,
  HostProperty,
  HostBooking,
} from "../services/hostService";

const HostDashboard: React.FC = () => {
  const [user] = useState(authService.getCurrentUser());
  const [stats, setStats] = useState<HostStats>({
    totalProperties: 0,
    totalBookings: 0,
    totalEarnings: 0,
    pendingProperties: 0,
    approvedProperties: 0,
  });
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [recentBookings, setRecentBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"properties" | "bookings">(
    "properties"
  );

  useEffect(() => {
    // Redirect if not authenticated
    if (!authService.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [statsData, propertiesData, bookingsData] = await Promise.all([
        hostService.getHostStats(),
        hostService.getHostProperties(),
        hostService.getHostBookings(5), // Last 5 bookings
      ]);

      setStats(statsData);
      setProperties(propertiesData);
      setRecentBookings(bookingsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyToggle = async (
    propertyId: string,
    isActive: boolean
  ) => {
    try {
      await hostService.togglePropertyStatus(propertyId, isActive);
      // Refresh properties
      const updatedProperties = await hostService.getHostProperties();
      setProperties(updatedProperties);
    } catch (error) {
      alert("Failed to update property status");
    }
  };

  const handleDeleteProperty = async (
    propertyId: string,
    propertyTitle: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`
      )
    ) {
      try {
        await hostService.deleteProperty(propertyId);
        // Refresh properties and stats
        const [updatedProperties, updatedStats] = await Promise.all([
          hostService.getHostProperties(),
          hostService.getHostStats(),
        ]);
        setProperties(updatedProperties);
        setStats(updatedStats);
        alert("Property deleted successfully");
      } catch (error) {
        alert("Failed to delete property");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        text: "⏳ Pending",
      },
      APPROVED: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        text: "✅ Approved",
      },
      REJECTED: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        text: "❌ Rejected",
      },
    };

    const style = styles[status as keyof typeof styles] || styles.PENDING;

    return (
      <span
        style={{
          ...style,
          padding: "0.25rem 0.75rem",
          borderRadius: "1rem",
          fontSize: "0.75rem",
          fontWeight: "500",
        }}
      >
        {style.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔄</div>
            <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
              Loading your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Header />

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}
      >
        {/* Welcome Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
              color: "#111827",
            }}
          >
            Welcome back, {user?.firstName}! 🏠
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "1.125rem",
            }}
          >
            Here's what's happening with your properties today
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Total Properties
                </p>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {stats.totalProperties}
                </p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>🏠</div>
            </div>
            <div
              style={{
                marginTop: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              {stats.approvedProperties} approved, {stats.pendingProperties}{" "}
              pending
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Total Bookings
                </p>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {stats.totalBookings}
                </p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>📅</div>
            </div>
            <div
              style={{
                marginTop: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              Across all your properties
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Total Earnings
                </p>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#059669",
                  }}
                >
                  ${stats.totalEarnings}
                </p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>💰</div>
            </div>
            <div
              style={{
                marginTop: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              From confirmed bookings
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            border: "1px solid #e5e7eb",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#111827",
                }}
              >
                Quick Actions
              </h2>
              <p style={{ color: "#6b7280" }}>
                Manage your properties and grow your business
              </p>
            </div>
            <a
              href="/create-property"
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                padding: "0.875rem 2rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1d4ed8")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
            >
              ➕ Add New Property
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setActiveTab("properties")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem 0.5rem 0 0",
                border: "none",
                backgroundColor:
                  activeTab === "properties" ? "white" : "#f3f4f6",
                color: activeTab === "properties" ? "#2563eb" : "#6b7280",
                fontWeight: activeTab === "properties" ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              🏠 My Properties ({properties.length})
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem 0.5rem 0 0",
                border: "none",
                backgroundColor: activeTab === "bookings" ? "white" : "#f3f4f6",
                color: activeTab === "bookings" ? "#2563eb" : "#6b7280",
                fontWeight: activeTab === "bookings" ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              📅 Recent Bookings ({recentBookings.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0 1rem 1rem 1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            border: "1px solid #e5e7eb",
            minHeight: "400px",
          }}
        >
          {activeTab === "properties" ? (
            // Properties Tab
            <>
              {properties.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    🏠
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      marginBottom: "1rem",
                      color: "#111827",
                    }}
                  >
                    No properties yet
                  </h3>
                  <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
                    Start earning by adding your first property to
                    Homelandbooking.com
                  </p>
                  <a
                    href="/create-property"
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "0.875rem 2rem",
                      borderRadius: "0.5rem",
                      textDecoration: "none",
                      fontSize: "1rem",
                      fontWeight: "600",
                    }}
                  >
                    ➕ Add Your First Property
                  </a>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.75rem",
                        padding: "1.5rem",
                        transition: "shadow 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "200px 1fr auto",
                          gap: "1.5rem",
                          alignItems: "start",
                        }}
                      >
                        {/* Property Image */}
                        <div
                          style={{ borderRadius: "0.5rem", overflow: "hidden" }}
                        >
                          <img
                            src={
                              property.images[0] ||
                              "https://via.placeholder.com/200x150?text=No+Image"
                            }
                            alt={property.title}
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                            }}
                          />
                        </div>

                        {/* Property Details */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <h3
                              style={{
                                fontSize: "1.25rem",
                                fontWeight: "600",
                                color: "#111827",
                              }}
                            >
                              {property.title}
                            </h3>
                            {getStatusBadge(property.approvalStatus)}
                          </div>

                          <p
                            style={{
                              color: "#6b7280",
                              marginBottom: "0.75rem",
                            }}
                          >
                            📍 {property.city}, {property.country}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <span>💰 ${property.pricePerNight}/night</span>
                            <span>🛏️ {property.bedrooms} beds</span>
                            <span>👥 {property.maxGuests} guests</span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            <span
                              style={{
                                color: property.isActive
                                  ? "#059669"
                                  : "#dc2626",
                              }}
                            >
                              {property.isActive ? "🟢 Active" : "🔴 Inactive"}
                            </span>
                            <span style={{ color: "#6b7280" }}>
                              📊 {property.totalBookings || 0} bookings
                            </span>
                            <span style={{ color: "#6b7280" }}>
                              💵 ${property.totalEarnings || 0} earned
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            onClick={() =>
                              window.open(`/property/${property.id}`, "_blank")
                            }
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#f3f4f6",
                              border: "none",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#e5e7eb")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#f3f4f6")
                            }
                          >
                            👁️ View
                          </button>

                          <button
                            onClick={() =>
                              (window.location.href = `/edit-property/${property.id}`)
                            }
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#dbeafe",
                              border: "none",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              color: "#1d4ed8",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#bfdbfe")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#dbeafe")
                            }
                          >
                            ✏️ Edit
                          </button>

                          <button
                            onClick={() =>
                              handlePropertyToggle(
                                property.id,
                                !property.isActive
                              )
                            }
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: property.isActive
                                ? "#fee2e2"
                                : "#dcfce7",
                              border: "none",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              color: property.isActive ? "#dc2626" : "#059669",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                          >
                            {property.isActive
                              ? "⏸️ Deactivate"
                              : "▶️ Activate"}
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteProperty(property.id, property.title)
                            }
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#fee2e2",
                              border: "none",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              color: "#dc2626",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#fecaca")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#fee2e2")
                            }
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Bookings Tab
            <>
              {recentBookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    📅
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      marginBottom: "1rem",
                      color: "#111827",
                    }}
                  >
                    No bookings yet
                  </h3>
                  <p style={{ color: "#6b7280" }}>
                    Bookings for your properties will appear here once guests
                    start booking.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.75rem",
                        padding: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <h3
                              style={{
                                fontSize: "1.125rem",
                                fontWeight: "600",
                                color: "#111827",
                              }}
                            >
                              {booking.property.title}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                              gap: "1rem",
                              fontSize: "0.875rem",
                              color: "#6b7280",
                            }}
                          >
                            <div>
                              <strong>Guest:</strong> {booking.guestFirstName}{" "}
                              {booking.guestLastName}
                            </div>
                            <div>
                              <strong>Dates:</strong>{" "}
                              {formatDate(booking.checkIn)} -{" "}
                              {formatDate(booking.checkOut)}
                            </div>
                            <div>
                              <strong>Guests:</strong> {booking.guestCount}
                            </div>
                            <div>
                              <strong>Total:</strong>{" "}
                              <span
                                style={{ color: "#059669", fontWeight: "600" }}
                              >
                                ${booking.totalPrice}
                              </span>
                            </div>
                          </div>

                          {booking.status === "CONFIRMED" && (
                            <div
                              style={{
                                marginTop: "1rem",
                                padding: "1rem",
                                backgroundColor: "#f0fdf4",
                                borderRadius: "0.5rem",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#059669",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <strong>Guest Contact:</strong>
                              </p>
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#374151",
                                }}
                              >
                                📞 {booking.guestPhone} | ✉️{" "}
                                {booking.guestEmail}
                              </p>
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          Booked {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
