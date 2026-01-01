import { db } from "../config/db.js";
import { userTable } from "../schema/index.js";
import { eq } from "drizzle-orm";
import { sendOTPEmail } from "../config/email.js";

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in user table
export const storeOTP = async (email, otp) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

  // Update user with verification code and expiration
  await db
    .update(userTable)
    .set({
      verificationCode: otp,
      verificationExpires: expiresAt,
    })
    .where(eq(userTable.email, email));

  return expiresAt;
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
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

  // Clear verification code after successful verification
  await db
    .update(userTable)
    .set({
      verificationCode: null,
      verificationExpires: null,
    })
    .where(eq(userTable.email, email));

  return { valid: true, message: "OTP verified successfully" };
};

// Send OTP to user
export const sendOTP = async (email, name) => {
  const otp = generateOTP();
  await storeOTP(email, otp);
  await sendOTPEmail(email, otp, name);
  return { success: true, message: "OTP sent to email" };
};
