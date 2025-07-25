// server/src/routes/auth.ts - ADD THESE ROUTES TO YOUR EXISTING AUTH ROUTES

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { emailService } from "../services/emailService";

const router = express.Router();
const prisma = new PrismaClient();

// ... your existing routes (register, login, etc.) ...
// 📝 REGISTER ROUTE
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        role: "USER",
        // isVerified: false, // Uncomment this line ONLY if your Prisma User model has an 'isVerified' field
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: { user, token },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

// 🔐 LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful!",
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});
// Forgot Password - Send reset email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      // Don't reveal whether user exists or not for security
      return res.json({
        message:
          "If an account with this email exists, we have sent you a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetToken
      );
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send reset email:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message:
        "If an account with this email exists, we have sent you a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify Reset Token
router.post("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Reset token is required" });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    res.json({
      valid: true,
      email: user.email,
      firstName: user.firstName,
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(
        user.email,
        user.firstName
      );
      console.log(`✅ Password reset confirmation sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change Password (for authenticated users)
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, password: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Send confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(
        user.email,
        user.firstName
      );
      console.log(`✅ Password change confirmation sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
