// client/src/services/hostService.ts
import api from "./api";
import { Property } from "./propertyService";

export interface HostStats {
  totalProperties: number;
  totalBookings: number;
  totalEarnings: number;
  pendingProperties: number;
  approvedProperties: number;
}

export interface HostBooking {
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
  property: {
    id: string;
    title: string;
    city: string;
    images: string[];
  };
  createdAt: string;
}

export interface HostProperty extends Property {
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  totalBookings?: number;
  totalEarnings?: number;
  isActive: boolean;
}

export const hostService = {
  // Get host dashboard stats
  getHostStats: async (): Promise<HostStats> => {
    try {
      const response = await api.get("/host/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching host stats:", error);
      return {
        totalProperties: 0,
        totalBookings: 0,
        totalEarnings: 0,
        pendingProperties: 0,
        approvedProperties: 0,
      };
    }
  },

  // Get host's properties
  getHostProperties: async (): Promise<HostProperty[]> => {
    try {
      const response = await api.get("/host/properties");
      return response.data.properties || [];
    } catch (error) {
      console.error("Error fetching host properties:", error);
      return [];
    }
  },

  // Get host's bookings
  getHostBookings: async (limit = 10): Promise<HostBooking[]> => {
    try {
      const response = await api.get(`/host/bookings?limit=${limit}`);
      return response.data.bookings || [];
    } catch (error) {
      console.error("Error fetching host bookings:", error);
      return [];
    }
  },

  // Update property status
  updateProperty: async (
    propertyId: string,
    data: Partial<HostProperty>
  ): Promise<HostProperty> => {
    try {
      const response = await api.put(`/properties/${propertyId}`, data);
      return response.data.property;
    } catch (error) {
      console.error("Error updating property:", error);
      throw error;
    }
  },

  // Delete property
  deleteProperty: async (propertyId: string): Promise<void> => {
    try {
      await api.delete(`/properties/${propertyId}`);
    } catch (error) {
      console.error("Error deleting property:", error);
      throw error;
    }
  },

  // Toggle property active status
  togglePropertyStatus: async (
    propertyId: string,
    isActive: boolean
  ): Promise<HostProperty> => {
    try {
      const response = await api.put(`/properties/${propertyId}/toggle`, {
        isActive,
      });
      return response.data.property;
    } catch (error) {
      console.error("Error toggling property status:", error);
      throw error;
    }
  },
};
