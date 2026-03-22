import "dotenv/config";

const devFrontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
const prodFrontend = (process.env.prod_FRONTEND_URL || process.env.PROD_FRONTEND_URL || "https://krishimitrafyp.vercel.app").replace(/\/+$/, "");
const isProd = process.env.NODE_ENV === "production";

const allOrigins = [devFrontend, prodFrontend]
  .flatMap((url) => url.split(","))
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const origins = [...new Set(allOrigins)];

const prodApiUrl = (process.env.prod_API_URL || "https://krishimitra-zzo6.onrender.com").replace(/\/+$/, "");
const serverDisplayUrl = isProd ? prodApiUrl : `http://localhost:${process.env.PORT || 5001}`;

export const ENV = {
    PORT: process.env.PORT || 5001,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    /** Checkout / email links: production uses prod URL so Stripe/Khalti return users to the live app */
    FRONTEND_URL: isProd ? prodFrontend : devFrontend,
    /** All allowed CORS origins */
    CORS_ORIGINS: origins,
    /** URL shown in server log: prod = prod_API_URL, dev = localhost:PORT */
    BACKEND_URL: serverDisplayUrl,
    DISEASE_API_BASE_URL: process.env.DISEASE_API_BASE_URL,
    // Email configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE || "false",
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    RESEND_API_KEY: process.env.Resend_API_KEY || process.env.RESEND_API_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
    /** Stripe (test mode): monthly recurring Price ID + webhook secret */
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    // Weather API configuration
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    // Cloudinary (images: profile, license)
    CLOUDINARY_CLOUD_NAME: process.env.cloudname,
    CLOUDINARY_API_KEY: process.env.cloudkey,
    CLOUDINARY_API_SECRET: process.env.cloudsecret,
    // Khalti (subscription) – sandbox for academic/testing; get secret from https://test-admin.khalti.com
    KHALTI_SECRET_KEY: process.env.KHALTI_SECRET_KEY,
    KHALTI_EPAYMENT_INITIATE_URL: process.env.KHALTI_EPAYMENT_INITIATE_URL || "https://dev.khalti.com/api/v2/epayment/initiate/",
    KHALTI_VERIFY_URL: process.env.KHALTI_VERIFY_URL || "https://dev.khalti.com/api/v2/payment/verify/",
    PREMIUM_AMOUNT_PAISA: parseInt(process.env.PREMIUM_AMOUNT_PAISA, 10) || 199900, // Rs 1999 (Khalti)
    /** Display / docs: international card price — must match your Stripe Price (e.g. 19.99 USD/month) */
    PREMIUM_STRIPE_USD: parseFloat(process.env.PREMIUM_STRIPE_USD) || 19.99,
    // DeepSeek AI (agro recommendations)
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
};