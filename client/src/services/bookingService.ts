// client/src/services/bookingService.ts
import api from "./api";

export interface BookingData {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  guestEmail: string;
  specialRequests?: string;
}

export interface Booking {
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
  specialRequests?: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    country: string;
    hostContact?: string; // Available after booking
    pinLocation?: string; // Available after booking
    images: string[];
    host: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export const bookingService = {
  // Create anonymous booking
  createBooking: async (bookingData: BookingData): Promise<Booking> => {
    try {
      const response = await api.post("/bookings/book", bookingData);
      return response.data.booking;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to create booking"
      );
    }
  },

  // Get booking by ID
  getBooking: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data.booking;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to fetch booking");
    }
  },

  // Calculate total price
  calculatePrice: (
    pricePerNight: number,
    checkIn: string,
    checkOut: string
  ): number => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights * pricePerNight;
  },

  // Calculate number of nights
  calculateNights: (checkIn: string, checkOut: string): number => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  },

  // Validate booking dates
  validateDates: (checkIn: string, checkOut: string): string | null => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (checkInDate < now) {
      return "Check-in date cannot be in the past";
    }

    if (checkOutDate <= checkInDate) {
      return "Check-out date must be after check-in date";
    }

    return null;
  },
};
