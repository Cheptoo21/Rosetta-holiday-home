// client/src/components/common/Header.tsx
import React from "react";
import { authService } from "../../services/authService";

const Header: React.FC = () => {
  const isLoggedIn = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">
              🏠 Homelandbooking.com
            </span>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a
              href="/"
              className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
            >
              Home
            </a>
            <a
              href="/properties"
              className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
            >
              Browse Properties
            </a>
            <a
              href="/attractions"
              className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
            >
              Attractions
            </a>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-700 text-sm">
                  Welcome, {user?.firstName}! 👋
                </span>
                <a
                  href="/host-dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Dashboard
                </a>
                <button
                  onClick={() => {
                    authService.logout();
                  }}
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
