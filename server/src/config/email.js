import nodemailer from "nodemailer";
import { ENV } from "./env.js";

// Create transporter for sending emails
export const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Send OTP email
export const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"KrishiMitra" <${ENV.SMTP_USER}>`,
    to: email,
    subject: "Verify Your Email - KrishiMitra",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Welcome to KrishiMitra!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with KrishiMitra. Please verify your email address using the OTP below:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2d5016; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account with KrishiMitra, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Send Password Reset OTP Email
export const sendPasswordResetOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"KrishiMitra" <${ENV.SMTP_USER}>`,
    to: email,
    subject: "Password Reset OTP - KrishiMitra",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your KrishiMitra account.</p>
        <p>Please use the OTP below to verify your identity:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2d5016; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset OTP email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset OTP email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send support reply email (contact form response)
export const sendSupportReplyEmail = async (toEmail, userName, originalMessage, adminReply) => {
  const mailOptions = {
    from: `"KrishiMitra Support" <${ENV.SMTP_USER}>`,
    to: toEmail,
    subject: "Re: Your support request - KrishiMitra",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Support Reply - KrishiMitra</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for contacting us. Here is our response to your query.</p>
        <div style="background-color: #f8f8f8; padding: 12px; margin: 16px 0; border-left: 4px solid #2d5016;">
          <strong>Your message:</strong><br/>
          <span style="color: #555;">${originalMessage.replace(/\n/g, "<br/>")}</span>
        </div>
        <div style="background-color: #e8f5e9; padding: 16px; margin: 16px 0; border-radius: 8px;">
          <strong>Our reply:</strong><br/>
          <span style="color: #1b5e20;">${adminReply.replace(/\n/g, "<br/>")}</span>
        </div>
        <p>If you have further questions, please submit another message from our Support page.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">KrishiMitra - Your farming companion.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Support reply email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending support reply email:", error);
    throw new Error("Failed to send support reply email");
  }
};