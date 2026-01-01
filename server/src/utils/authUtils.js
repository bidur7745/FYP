import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

// ============================================
// PASSWORD HASHING UTILITIES
// ============================================
const SALT_ROUNDS = 10;

// HASH PASSWORD
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// compate password used while login
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ============================================
// JWT TOKEN UTILITIES
// ============================================

  // generate JWT token
export const generateToken = (payload) => {
  if (!ENV.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured. Please add it to your .env file.");
  }
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
};

// verify JWT token
export const verifyToken = (token) => {
  try {
    if (!ENV.JWT_SECRET) {
      return { valid: false, error: "JWT_SECRET is not configured" };
    }
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// extract token from Authorization header
export const extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }
  
  // Format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }
  
  return null;
};

// ============================================
// PASSWORD VALIDATION UTILITIES
// ============================================

// password validation utility
export const validatePassword = (password) => {
  const errors = [];

  // check minimum length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // check for numeric character
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one numeric character");
  }

  // check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    message: errors.length > 0 
      ? errors.join(". ") 
      : "Password is valid"
  };
};
