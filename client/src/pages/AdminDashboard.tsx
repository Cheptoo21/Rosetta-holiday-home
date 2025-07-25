// client/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  adminService,
  AdminStats,
  PendingProperty,
  PlatformBooking,
} from "../services/adminService";

const AdminDashboard: React.FC = () => {
  const [admin] = useState(adminService.getCurrentAdmin());
  const [stats, setStats] = useState<AdminStats>({
    totalHosts: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingProperties: 0,
    activeProperties: 0,
    rejectedProperties: 0,
    todayBookings: 0,
    thisMonthRevenue: 0,
  });
  const [pendingProperties, setPendingProperties] = useState<PendingProperty[]>(
    []
  );
  const [recentBookings, setRecentBookings] = useState<PlatformBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "properties" | "bookings"
  >("overview");

  useEffect(() => {
    // Redirect if not authenticated
    if (!adminService.isAuthenticated()) {
      window.location.href = "/admin";
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all admin data in parallel
      const [statsData, pendingData, bookingsData] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingProperties(),
        adminService.getAllBookings(10),
      ]);

      setStats(statsData);
      setPendingProperties(pendingData);
      setRecentBookings(bookingsData);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      alert("Failed to load dashboard data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProperty = async (propertyId: string, title: string) => {
    if (
      window.confirm(`Approve "${title}"? This will make it visible to guests.`)
    ) {
      try {
        await adminService.approveProperty(propertyId);
        alert("Property approved successfully!");
        // Refresh data
        loadDashboardData();
      } catch (error) {
        alert("Failed to approve property");
      }
    }
  };

  const handleRejectProperty = async (propertyId: string, title: string) => {
    const reason = window.prompt(
      `Reject "${title}"?\n\nPlease provide a reason for rejection:`
    );
    if (reason && reason.trim()) {
      try {
        await adminService.rejectProperty(propertyId, reason.trim());
        alert("Property rejected successfully!");
        // Refresh data
        loadDashboardData();
      } catch (error) {
        alert("Failed to reject property");
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
      CONFIRMED: {
        backgroundColor: "#dbeafe",
        color: "#1e40af",
        text: "✅ Confirmed",
      },
      COMPLETED: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        text: "🎉 Completed",
      },
      CANCELLED: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        text: "❌ Cancelled",
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚙️</div>
            <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
              Loading admin dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Admin Header */}
      <header
        style={{
          backgroundColor: "#1f2937",
          color: "white",
          padding: "1rem 0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  marginBottom: "0.25rem",
                }}
              >
                🛡️ Admin Dashboard
              </h1>
              <p style={{ color: "#d1d5db", fontSize: "0.875rem" }}>
                Homelandbooking.com Platform Management
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.875rem" }}>
                Welcome, {admin?.firstName}! 👋
              </span>
              <button
                onClick={() => adminService.logout()}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#b91c1c")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#dc2626")
                }
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}
      >
        {/* Platform Stats */}
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
                  Total Hosts
                </p>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {stats.totalHosts}
                </p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>👥</div>
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
              {stats.activeProperties} active, {stats.pendingProperties} pending
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
              {stats.todayBookings} today
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
                  Platform Revenue
                </p>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#059669",
                  }}
                >
                  {formatCurrency(stats.totalRevenue)}
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
              {formatCurrency(stats.thisMonthRevenue)} this month
            </div>
          </div>
        </div>

        {/* Urgent Actions */}
        {stats.pendingProperties > 0 && (
          <div
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "1rem",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2rem" }}>⚠️</div>
              <div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#92400e",
                    marginBottom: "0.5rem",
                  }}
                >
                  Action Required
                </h3>
                <p style={{ color: "#92400e" }}>
                  {stats.pendingProperties} propert
                  {stats.pendingProperties > 1 ? "ies are" : "y is"} waiting for
                  approval
                </p>
              </div>
              <button
                onClick={() => setActiveTab("properties")}
                style={{
                  backgroundColor: "#f59e0b",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                Review Properties
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { id: "overview", label: "📊 Platform Overview", count: null },
              {
                id: "properties",
                label: "🏠 Property Management",
                count: stats.pendingProperties,
              },
              {
                id: "bookings",
                label: "📅 Booking Management",
                count: recentBookings.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  border: "none",
                  backgroundColor: activeTab === tab.id ? "white" : "#f3f4f6",
                  color: activeTab === tab.id ? "#dc2626" : "#6b7280",
                  fontWeight: activeTab === tab.id ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span
                    style={{
                      backgroundColor:
                        activeTab === tab.id ? "#dc2626" : "#ef4444",
                      color: "white",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
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
            minHeight: "500px",
          }}
        >
          {activeTab === "overview" && (
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1.5rem",
                  color: "#111827",
                }}
              >
                Platform Overview
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2rem",
                }}
              >
                {/* Recent Activity */}
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "#111827",
                    }}
                  >
                    Recent Activity
                  </h3>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        <strong>{stats.pendingProperties}</strong> properties
                        awaiting approval
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "#f0fdf4",
                        borderRadius: "0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <p style={{ fontSize: "0.875rem", color: "#059669" }}>
                        <strong>{stats.todayBookings}</strong> new bookings
                        today
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "#fef3c7",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <p style={{ fontSize: "0.875rem", color: "#92400e" }}>
                        <strong>
                          {formatCurrency(stats.thisMonthRevenue)}
                        </strong>{" "}
                        revenue this month
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "#111827",
                    }}
                  >
                    Quick Actions
                  </h3>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <button
                      onClick={() => setActiveTab("properties")}
                      style={{
                        padding: "1rem",
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#b91c1c")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#dc2626")
                      }
                    >
                      🏠 Review Pending Properties ({stats.pendingProperties})
                    </button>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      style={{
                        padding: "1rem",
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1d4ed8")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#2563eb")
                      }
                    >
                      📅 View Recent Bookings
                    </button>
                    <button
                      onClick={() => window.open("/admin/reports", "_blank")}
                      style={{
                        padding: "1rem",
                        backgroundColor: "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#047857")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#059669")
                      }
                    >
                      📊 Generate Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "properties" && (
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1.5rem",
                  color: "#111827",
                }}
              >
                Property Management
              </h2>

              {pendingProperties.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    ✅
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      marginBottom: "1rem",
                      color: "#111827",
                    }}
                  >
                    All caught up!
                  </h3>
                  <p style={{ color: "#6b7280" }}>
                    No properties are waiting for approval at the moment.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  {pendingProperties.map((property) => (
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
                            📍 {property.address}, {property.city},{" "}
                            {property.country}
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

                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#374151",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {property.description.length > 100
                              ? `${property.description.substring(0, 100)}...`
                              : property.description}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            <span style={{ color: "#6b7280" }}>
                              Host: {property.host.firstName}{" "}
                              {property.host.lastName}
                            </span>
                            <span style={{ color: "#6b7280" }}>
                              Listed: {formatDate(property.createdAt)}
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
                              handleApproveProperty(property.id, property.title)
                            }
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#dcfce7",
                              border: "none",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              color: "#059669",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#bbf7d0")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#dcfce7")
                            }
                          >
                            ✅ Approve
                          </button>

                          <button
                            onClick={() =>
                              handleRejectProperty(property.id, property.title)
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
                            ❌ Reject
                          </button>

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
                            👁️ Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1.5rem",
                  color: "#111827",
                }}
              >
                Platform Bookings
              </h2>

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
                    No recent bookings
                  </h3>
                  <p style={{ color: "#6b7280" }}>
                    Platform bookings will appear here as guests make
                    reservations.
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
                              <strong>Host:</strong>{" "}
                              {booking.property.host.firstName}{" "}
                              {booking.property.host.lastName}
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
                              <strong>Revenue:</strong>{" "}
                              <span
                                style={{ color: "#059669", fontWeight: "600" }}
                              >
                                {formatCurrency(booking.totalPrice)}
                              </span>
                            </div>
                            <div>
                              <strong>Contact:</strong> {booking.guestPhone}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          Booked {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
