// client/src/types/index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isHost: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hostId: string;
  categoryId: string;
  host: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category: Category;
  avgRating?: number;
  totalReviews?: number;
  _count?: {
    reviews: number;
    bookings: number;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}
