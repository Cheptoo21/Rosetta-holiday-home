// client/src/services/propertyService.ts
import api from "./api";

export interface Property {
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

  // New fields for Homelandbooking.com
  distanceFromTown?: string;
  accessTime?: string;
  otherUnits?: string;
  pinLocation?: string;
  hostContact?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";

  host: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  avgRating?: number;
  totalReviews?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export const propertyService = {
  // Get all properties
  getProperties: async (): Promise<Property[]> => {
    try {
      const response = await api.get("/properties");
      return response.data.properties || [];
    } catch (error) {
      console.error("Error fetching properties:", error);
      return [];
    }
  },

  // Get single property
  getProperty: async (id: string): Promise<Property | null> => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching property:", error);
      return null;
    }
  },

  // Get categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get("/categories");
      return response.data.categories || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  // Seed categories (for development)
  seedCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get("/categories/seed");
      return response.data.categories || [];
    } catch (error) {
      console.error("Error seeding categories:", error);
      return [];
    }
  },

  // Search properties
  searchProperties: async (params: {
    city?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    maxGuests?: number;
  }): Promise<Property[]> => {
    try {
      const response = await api.get("/properties", { params });
      return response.data.properties || [];
    } catch (error) {
      console.error("Error searching properties:", error);
      return [];
    }
  },
};
