import sgMail from "@sendgrid/mail";
import { ENV } from "./env.js";

const EMAIL_FROM = ENV.SENDGRID_FROM_EMAIL || "KrishiMitra <bidursiwakoti2062@gmail.com>";

if (ENV.SENDGRID_API_KEY) {
  sgMail.setApiKey(ENV.SENDGRID_API_KEY);
  console.log("SendGrid email service initialized");
} else {
  console.warn(
    "SendGrid is not configured. Set SENDGRID_API_KEY in environment."
  );
}

const sendEmail = async ({ to, subject, html }) => {
  if (!ENV.SENDGRID_API_KEY) {
    throw new Error("SendGrid is not configured. Set SENDGRID_API_KEY.");
  }

  const msg = { to, from: EMAIL_FROM, subject, html };

  try {
    const [response] = await sgMail.send(msg);
    return { success: true, messageId: response?.headers?.["x-message-id"] || response?.statusCode };
  } catch (err) {
    if (err.response) {
      console.error("SendGrid error body:", JSON.stringify(err.response.body, null, 2));
    }
    throw err;
  }
};

// Send OTP email
export const sendOTPEmail = async (email, otp, name) => {
  const html = `
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
    `;

  try {
    const info = await sendEmail({
      to: email,
      subject: "Verify Your Email - KrishiMitra",
      html,
    });
    console.log("OTP email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Send Password Reset OTP Email
export const sendPasswordResetOTPEmail = async (email, otp, name) => {
  const html = `
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
    `;

  try {
    const info = await sendEmail({
      to: email,
      subject: "Password Reset OTP - KrishiMitra",
      html,
    });
    console.log("Password reset OTP email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset OTP email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send support reply email (contact form response)
export const sendSupportReplyEmail = async (toEmail, userName, originalMessage, adminReply) => {
  const html = `
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
    `;

  try {
    const info = await sendEmail({
      to: toEmail,
      subject: "Re: Your support request - KrishiMitra",
      html,
    });
    console.log("Support reply email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending support reply email:", error);
    throw new Error("Failed to send support reply email");
  }
};

export const sendSubscriptionActivatedEmail = async (email, userName, plan, expiresAt) => {
  const expiresStr = expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : "";
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Welcome to Premium!</h2>
        <p>Hello ${userName},</p>
        <p>Your Premium subscription is now active. Thank you for supporting KrishiMitra.</p>
        <div style="background-color: #e8f5e9; padding: 16px; margin: 16px 0; border-radius: 8px;">
          <p style="margin: 0;"><strong>Plan:</strong> ${plan || "Premium Monthly"}</p>
          ${expiresStr ? `<p style="margin: 8px 0 0 0;"><strong>Access until:</strong> ${expiresStr}</p>` : ""}
        </div>
        <p>You now have access to expert verification, priority support, higher scan limits, and more. Cancel anytime from your account.</p>
        <p><a href="${ENV.FRONTEND_URL || "https://krishimitra.com"}/dashboard/user" style="color: #2d5016;">Go to Dashboard</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">KrishiMitra - Your farming companion.</p>
      </div>
    `;
  try {
    const info = await sendEmail({
      to: email,
      subject: "Welcome to Premium - KrishiMitra",
      html,
    });
    console.log("Subscription activated email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending subscription activated email:", error);
    throw new Error("Failed to send subscription email");
  }
};

export const sendSubscriptionCancelledEmail = async (email, userName, expiresAt) => {
  const expiresStr = expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : "";
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Subscription cancelled</h2>
        <p>Hello ${userName},</p>
        <p>Your Premium subscription has been cancelled as requested.</p>
        ${expiresStr ? `<p>You will continue to have Premium access until <strong>${expiresStr}</strong>. After that, you can resubscribe anytime.</p>` : ""}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">KrishiMitra - Your farming companion.</p>
      </div>
    `;
  try {
    const info = await sendEmail({
      to: email,
      subject: "Subscription cancelled - KrishiMitra",
      html,
    });
    console.log("Subscription cancelled email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending subscription cancelled email:", error);
    throw new Error("Failed to send subscription cancelled email");
  }
};
