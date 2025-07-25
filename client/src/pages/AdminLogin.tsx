// client/src/pages/AdminLogin.tsx
import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if already logged in as admin
    if (adminService.isAuthenticated()) {
      window.location.href = "/admin/dashboard";
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Validate form
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      // Admin login
      const response = await adminService.login(
        formData.email,
        formData.password
      );

      // Success! Redirect to admin dashboard
      alert(`Welcome to the admin panel, ${response.admin.firstName}!`);
      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      setError(
        err.message || "Admin login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1f2937",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem 1rem",
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)",
          backgroundSize: "20px 20px",
          zIndex: 0,
        }}
      />

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: "3rem",
          width: "100%",
          maxWidth: "450px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          border: "1px solid #e5e7eb",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "700",
            }}
          >
            🛡️
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
              color: "#111827",
            }}
          >
            Admin Portal
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "1rem",
            }}
          >
            Homelandbooking.com Administration
          </p>
          <div
            style={{
              width: "60px",
              height: "3px",
              backgroundColor: "#dc2626",
              margin: "1rem auto",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Security Notice */}
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            padding: "1rem",
            marginBottom: "2rem",
            color: "#991b1b",
            fontSize: "0.875rem",
            textAlign: "center",
          }}
        >
          🔒 <strong>Authorized Personnel Only</strong>
          <br />
          This is a restricted administrative area
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
              color: "#dc2626",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                color: "#374151",
              }}
            >
              Admin Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@homelandbooking.com"
              required
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "2px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                transition: "border-color 0.2s",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#dc2626")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                color: "#374151",
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter admin password"
              required
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "2px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                transition: "border-color 0.2s",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#dc2626")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "#9ca3af"
                : "linear-gradient(135deg, #dc2626, #991b1b)",
              color: "white",
              padding: "1rem",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 4px 14px rgba(220, 38, 38, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(220, 38, 38, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(220, 38, 38, 0.3)";
              }
            }}
          >
            {loading ? "🔄 Authenticating..." : "🛡️ Access Admin Panel"}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              marginBottom: "0.5rem",
            }}
          >
            Platform Administration • Homelandbooking.com
          </p>
          <a
            href="/"
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            ← Back to Main Site
          </a>
        </div>

        {/* Development Note */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#f0f9ff",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
            color: "#0369a1",
            textAlign: "center",
          }}
        >
          <strong>Development Mode:</strong>
          <br />
          Use admin credentials created via API
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
