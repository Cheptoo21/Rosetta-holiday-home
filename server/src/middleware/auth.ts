// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token has expired" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Token verification failed" });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};
