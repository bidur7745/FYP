import { db } from "../config/db.js";
import { userTable, userDetailsTable } from "../schema/index.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, validatePassword, generateToken } from "../utils/authUtils.js";
import { sendOTP, generateOTP, storeOTP } from "./otpService.js";
import { sendPasswordResetOTPEmail } from "../config/email.js";

// CREATE USER SERVICE
export const createUser = async (payload) => {
    const { name, email, password, phone, address, role } = payload;
  
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }
  
    // Check if email exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));
  
    if (existingUser.length > 0) {
      throw new Error("Email already registered");
    }
  
    const hashedPassword = await hashPassword(password);
  
    // Insert into users table (isVerified defaults to false)
    const insertedUser = await db
      .insert(userTable)
      .values({
        name,
        email,
        password: hashedPassword,
        role: role || "user",
        isVerified: false, // User is not verified until OTP is confirmed
      })
      .returning();
  
    const userId = insertedUser[0].id;
  
    // Insert into userDetails table
    await db.insert(userDetailsTable).values({
      userId,
      phone: phone || null,
      address: address || null,
    });
  
    // Send OTP email for verification
    await sendOTP(email, name);
  
    // Return final user object
    return {
      id: userId,
      name,
      email,
      role: role || "user",
      isVerified: false,
      message: "User created successfully. Please check your email for verification OTP.",
    };
  };

// VERIFY USER SERVICE
export const verifyUser = async (email, otp) => {
  const { verifyOTP } = await import("./otpService.js");
  
  // Verify OTP
  const verificationResult = await verifyOTP(email, otp);
  
  if (!verificationResult.valid) {
    throw new Error(verificationResult.message);
  }
  
  // Update user's isVerified status
  const updatedUser = await db
    .update(userTable)
    .set({ isVerified: true })
    .where(eq(userTable.email, email))
    .returning();
  
  if (updatedUser.length === 0) {
    throw new Error("User not found");
  }
  
  return {
    success: true,
    message: "Email verified successfully",
    user: {
      id: updatedUser[0].id,
      email: updatedUser[0].email,
      isVerified: updatedUser[0].isVerified,
    },
  };
};

// LOGIN USER SERVICE
export const loginUser = async (email, password) => {
  // Find user by email
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (user.length === 0) {
    throw new Error("Invalid email or password");
  }

  const userRecord = user[0];

  // Check if user is verified
  if (!userRecord.isVerified) {
    throw new Error("Please verify your email before logging in");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, userRecord.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
  const token = generateToken({
    id: userRecord.id,
    email: userRecord.email,
    role: userRecord.role,
  });

  // Return user data with token
  return {
    success: true,
    message: "Login successful",
    token,
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      isVerified: userRecord.isVerified,
    },
  };
};

// REQUEST PASSWORD RESET SERVICE (Step 1)
// Generates OTP, saves to verificationCode/verificationExpires, sends email
export const requestPasswordReset = async (email) => {
  // Find user by email
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (user.length === 0) {
    // Don't reveal if email exists for security
    return {
      success: true,
      message: "If the email exists, a password reset OTP has been sent.",
    };
  }

  const userRecord = user[0];

  // Generate OTP
  const otp = generateOTP();

  // Store OTP in verificationCode and verificationExpires
  await storeOTP(email, otp);

  // Send password reset OTP email
  try {
    await sendPasswordResetOTPEmail(email, otp, userRecord.name);
  } catch (error) {
    console.error("Error sending password reset OTP email:", error);
    throw new Error("Failed to send password reset email");
  }

  return {
    success: true,
    message: "If the email exists, a password reset OTP has been sent.",
  };
};

// VERIFY PASSWORD RESET OTP SERVICE (Step 2)
// Checks if OTP matches and is valid, but doesn't clear it
export const verifyPasswordResetOTP = async (email, otp) => {
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (user.length === 0) {
    return { valid: false, message: "User not found" };
  }

  const userRecord = user[0];

  // Check if OTP matches and is not expired
  if (
    !userRecord.verificationCode ||
    userRecord.verificationCode !== otp ||
    !userRecord.verificationExpires ||
    new Date(userRecord.verificationExpires) < new Date()
  ) {
    return { valid: false, message: "Invalid or expired OTP" };
  }

  // Don't clear the OTP here - it will be cleared in Step 3
  return { valid: true, message: "OTP verified successfully" };
};

// RESET PASSWORD SERVICE (Step 3)
// Updates password and clears verificationCode/verificationExpires
export const resetPassword = async (email, otp, newPassword) => {
  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.message);
  }

  // Find user by email
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (user.length === 0) {
    throw new Error("User not found");
  }

  const userRecord = user[0];

  // Verify OTP again before resetting password
  if (
    !userRecord.verificationCode ||
    userRecord.verificationCode !== otp ||
    !userRecord.verificationExpires ||
    new Date(userRecord.verificationExpires) < new Date()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear verificationCode/verificationExpires
  await db
    .update(userTable)
    .set({
      password: hashedPassword,
      verificationCode: null,
      verificationExpires: null,
    })
    .where(eq(userTable.email, email));

  return {
    success: true,
    message: "Password has been reset successfully",
  };
};
  