// client/src/services/authService.ts
import api from "./api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: "USER" | "ADMIN";
  isHost: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  private tokenKey = "token";
  private userKey = "user";

  // Login user
  login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/login", credentials);

      // Store token and user data
      localStorage.setItem(this.tokenKey, response.data.data.token);
      localStorage.setItem(
        this.userKey,
        JSON.stringify(response.data.data.user)
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // Register new user
  register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/register", userData);

      // Store token and user data
      localStorage.setItem(this.tokenKey, response.data.data.token);
      localStorage.setItem(
        this.userKey,
        JSON.stringify(response.data.data.user)
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  };

  // Forgot password - send reset email
  forgotPassword = async (email: string): Promise<{ message: string }> => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to send reset email"
      );
    }
  };

  // Reset password with token
  resetPassword = async (
    resetData: ResetPasswordData
  ): Promise<{ message: string }> => {
    try {
      const response = await api.post("/auth/reset-password", resetData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Password reset failed");
    }
  };

  // Verify reset token
  verifyResetToken = async (
    token: string
  ): Promise<{ valid: boolean; email?: string }> => {
    try {
      const response = await api.post("/auth/verify-reset-token", { token });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Invalid reset token");
    }
  };

  // Logout user
  logout = (): void => {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    window.location.href = "/";
  };

  // Check if user is authenticated
  isAuthenticated = (): boolean => {
    const token = localStorage.getItem(this.tokenKey);
    return !!token;
  };

  // Get current user
  getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  };

  // Get auth token
  getToken = (): string | null => {
    return localStorage.getItem(this.tokenKey);
  };

  // Update user data in localStorage
  updateUser = (user: User): void => {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  };

  // Check if user is admin
  isAdmin = (): boolean => {
    const user = this.getCurrentUser();
    return user?.role === "ADMIN";
  };

  // Check if user is host
  isHost = (): boolean => {
    const user = this.getCurrentUser();
    return user?.isHost === true;
  };
}

export const authService = new AuthService();
export default authService;
