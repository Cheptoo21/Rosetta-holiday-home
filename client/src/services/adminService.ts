// client/src/services/adminService.ts
import api from "./api";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
}

export interface AdminStats {
  totalHosts: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  pendingProperties: number;
  activeProperties: number;
  rejectedProperties: number;
  todayBookings: number;
  thisMonthRevenue: number;
}

export interface PendingProperty {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  host: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

export interface PlatformBooking {
  id: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  guestEmail: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    images: string[];
    host: {
      firstName: string;
      lastName: string;
    };
  };
}

export const adminService = {
  // Admin login
  login: async (
    email: string,
    password: string
  ): Promise<{ admin: AdminUser; token: string }> => {
    try {
      const response = await api.post("/admin/login", { email, password });

      // Store admin token separately from host token
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminUser", JSON.stringify(response.data.admin));

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Admin login failed");
    }
  },

  // Admin logout
  logout: (): void => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/admin";
  },

  // Check if admin is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("adminToken");
  },

  // Get current admin user
  getCurrentAdmin: (): AdminUser | null => {
    const adminStr = localStorage.getItem("adminUser");
    return adminStr ? JSON.parse(adminStr) : null;
  },

  // Get admin token
  getToken: (): string | null => {
    return localStorage.getItem("adminToken");
  },

  // Get platform statistics
  getStats: async (): Promise<AdminStats> => {
    try {
      // Use admin token for requests
      const token = adminService.getToken();
      const response = await api.get("/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      throw error;
    }
  },

  // Get pending properties for approval
  getPendingProperties: async (): Promise<PendingProperty[]> => {
    try {
      const token = adminService.getToken();
      const response = await api.get("/admin/properties/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.properties || [];
    } catch (error) {
      console.error("Error fetching pending properties:", error);
      return [];
    }
  },

  // Get all properties (with filters)
  getAllProperties: async (
    status?: "PENDING" | "APPROVED" | "REJECTED"
  ): Promise<PendingProperty[]> => {
    try {
      const token = adminService.getToken();
      const params = status ? { status } : {};
      const response = await api.get("/admin/properties", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data.properties || [];
    } catch (error) {
      console.error("Error fetching all properties:", error);
      return [];
    }
  },

  // Approve property
  approveProperty: async (propertyId: string): Promise<void> => {
    try {
      const token = adminService.getToken();
      await api.put(
        `/admin/properties/${propertyId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Error approving property:", error);
      throw error;
    }
  },

  // Reject property
  rejectProperty: async (propertyId: string, reason: string): Promise<void> => {
    try {
      const token = adminService.getToken();
      await api.put(
        `/admin/properties/${propertyId}/reject`,
        { rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error rejecting property:", error);
      throw error;
    }
  },

  // Get all platform bookings
  getAllBookings: async (limit = 20): Promise<PlatformBooking[]> => {
    try {
      const token = adminService.getToken();
      const response = await api.get(`/admin/bookings?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.bookings || [];
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      return [];
    }
  },

  // Get all hosts
  getAllHosts: async (): Promise<any[]> => {
    try {
      const token = adminService.getToken();
      const response = await api.get("/admin/hosts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.hosts || [];
    } catch (error) {
      console.error("Error fetching hosts:", error);
      return [];
    }
  },

  // Delete property (admin override)
  deleteProperty: async (propertyId: string): Promise<void> => {
    try {
      const token = adminService.getToken();
      await api.delete(`/admin/properties/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error deleting property:", error);
      throw error;
    }
  },
};
