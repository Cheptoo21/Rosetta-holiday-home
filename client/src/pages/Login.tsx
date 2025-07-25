// client/src/pages/Login.tsx
import React, { useState } from "react";
import { authService } from "../services/authService";
import Header from "../components/common/Header";

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Only clear the specific field error, not the general error
    if (errors[name] && name !== "general") {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        // Don't clear 'general' error here!
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (activeTab === "signup") {
      if (!formData.firstName) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      if (activeTab === "login") {
        const response = await authService.login({
          email: formData.email,
          password: formData.password,
        });

        alert(`Welcome back, ${response.user.firstName}!`);
        window.location.href = "/host-dashboard";
      } else {
        const response = await authService.register({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        });

        alert(`Welcome to Homelandbooking.com, ${response.user.firstName}!`);
        window.location.href = "/host-dashboard";
      }
    } catch (err: any) {
      // ✅ Get the actual error message from the API response
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";

      // Handle specific error types
      if (
        errorMessage.includes("Invalid credentials") ||
        errorMessage.includes("invalid credentials")
      ) {
        setErrors({
          general:
            "Invalid email or password. Please check your credentials and try again.",
          email: "Please check your email",
          password: "Please check your password",
        });
      } else if (
        errorMessage.includes("User already exists") ||
        errorMessage.includes("already exists")
      ) {
        setErrors({
          general:
            "An account with this email already exists. Please login instead.",
          email: "This email is already registered",
        });
        setActiveTab("login"); // Switch to login tab
      } else if (
        errorMessage.includes("User not found") ||
        errorMessage.includes("not found")
      ) {
        setErrors({
          general: "No account found with this email. Please sign up first.",
          email: "Email not found",
        });
        setActiveTab("signup"); // Switch to signup tab
      } else if (errorMessage.includes("Password")) {
        setErrors({
          general: "Password requirements not met",
          password: errorMessage,
        });
      } else {
        setErrors({
          general: errorMessage,
        });
      }

      // Clear error after 8 seconds instead of immediately
      setTimeout(() => {
        setErrors((prev) => ({ ...prev, general: "" }));
      }, 8000);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      setErrors({ email: "Please enter your email address" });
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage("");

    try {
      await authService.forgotPassword(forgotPasswordEmail);
      setForgotPasswordMessage(
        "Password reset link sent to your email! Check your inbox."
      );
      setErrors({});
    } catch (err: any) {
      setErrors({
        general: err.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-red-700">⚠️ {message}</p>
        </div>
      </div>
    </div>
  );

  const SuccessMessage = ({ message }: { message: string }) => (
    <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-green-700">✅ {message}</p>
        </div>
      </div>
    </div>
  );

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {errors.general && <ErrorMessage message={errors.general} />}
            {forgotPasswordMessage && (
              <SuccessMessage message={forgotPasswordMessage} />
            )}

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {forgotPasswordLoading
                    ? "🔄 Sending..."
                    : "📧 Send Reset Link"}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          🏠 Homelandbooking.com
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {activeTab === "login"
            ? "Sign in to your host account"
            : "Create your host account"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Tab Navigation */}
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                activeTab === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                activeTab === "signup"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Messages */}
          {errors.general && <ErrorMessage message={errors.general} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === "signup" && (
              <>
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.firstName ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.lastName ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password *
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {activeTab === "signup" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password *
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading
                  ? activeTab === "login"
                    ? "🔄 Signing In..."
                    : "🔄 Creating Account..."
                  : activeTab === "login"
                  ? "🔐 Sign In"
                  : "🎉 Create Host Account"}
              </button>
            </div>

            {activeTab === "login" && (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
