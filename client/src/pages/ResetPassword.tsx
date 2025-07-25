// client/src/pages/ResetPassword.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setErrors({
          general: "Invalid reset link. Please request a new password reset.",
        });
        return;
      }

      try {
        const response = await authService.verifyResetToken(token);
        if (response.valid) {
          setTokenValid(true);
          setUserEmail(response.email || "");
        } else {
          setTokenValid(false);
          setErrors({
            general:
              "This reset link has expired or is invalid. Please request a new password reset.",
          });
        }
      } catch (error: any) {
        setTokenValid(false);
        setErrors({
          general:
            error.message ||
            "Invalid reset link. Please request a new password reset.",
        });
      }
    };

    verifyToken();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setLoading(true);
    setErrors({});

    try {
      await authService.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setResetSuccess(true);
    } catch (error: any) {
      setErrors({
        general: error.message || "Password reset failed. Please try again.",
      });
    } finally {
      setLoading(false);
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

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password Reset Successful! 🎉
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your password has been successfully updated.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="bg-green-100 rounded-full h-16 w-16 mx-auto flex items-center justify-center mb-4">
                <span className="text-green-600 text-2xl">✅</span>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Password Updated Successfully
              </h3>

              <p className="text-gray-600 mb-6">
                You can now login with your new password.
              </p>

              <div className="space-y-4">
                <a
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🔐 Login to Your Account
                </a>

                <a
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🏠 Go to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Invalid Reset Link
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This link has expired or is invalid.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="bg-red-100 rounded-full h-16 w-16 mx-auto flex items-center justify-center mb-4">
                <span className="text-red-600 text-2xl">❌</span>
              </div>

              {errors.general && <ErrorMessage message={errors.general} />}

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Reset Link Invalid
              </h3>

              <p className="text-gray-600 mb-6">
                This reset link has expired or is invalid. Please request a new
                password reset.
              </p>

              <div className="space-y-4">
                <a
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🔐 Go to Login
                </a>

                <a
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🏠 Go to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          🔐 Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password for {userEmail}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errors.general && <ErrorMessage message={errors.general} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password *
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.newPassword ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password *
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
                  placeholder="Confirm your new password"
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

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Password Requirements:</strong>
                  </p>
                  <ul className="mt-2 text-sm text-blue-600 list-disc list-inside">
                    <li>At least 6 characters long</li>
                    <li>Use a mix of letters, numbers, and symbols</li>
                    <li>Don't use easily guessable information</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? "🔄 Updating Password..." : "🔐 Update Password"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
