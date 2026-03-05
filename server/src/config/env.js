import "dotenv/config";

export const ENV ={
    PORT: process.env.PORT || 5001,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
    DISEASE_API_BASE_URL: process.env.DISEASE_API_BASE_URL,
    // Email configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE || "false",
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
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
    PREMIUM_AMOUNT_PAISA: parseInt(process.env.PREMIUM_AMOUNT_PAISA, 10) || 199900, // Rs 1999
};