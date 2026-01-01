import { verifyToken, extractToken } from "../utils/authUtils.js";
import { db } from "../config/db.js";
import { userTable } from "../schema/index.js";
import { eq } from "drizzle-orm";

// Authentication middleware - verifies token and attaches user to request
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const tokenResult = verifyToken(token);
    if (!tokenResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Get user from database
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, tokenResult.decoded.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request object
    req.user = {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role,
      isVerified: user[0].isVerified,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};
