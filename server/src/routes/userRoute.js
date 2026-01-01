import { Router } from "express";
import { registerUser, verifyOTP, login, forgotPassword, verifyPasswordResetOTP, resetPasswordController, userDashboard, adminDashboard, expertDashboard } from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// REGISTER ROUTE
router.post("/register", registerUser);

// VERIFY OTP ROUTE
router.post("/verify-otp", verifyOTP);

// LOGIN ROUTE
router.post("/login", login);

// PASSWORD RESET ROUTES
// Step 1: Request password reset (forgot password)
router.post("/forgot-password", forgotPassword);

// Step 2: Verify password reset OTP
router.post("/verify-password-reset-otp", verifyPasswordResetOTP);

// Step 3: Reset password with OTP
router.post("/reset-password", resetPasswordController);

// DASHBOARD ROUTES (Protected)
// USER DASHBOARD - Requires authentication and user role
router.get("/user", authenticate, authorize("user"), userDashboard);

// ADMIN DASHBOARD - Requires authentication and admin role
router.get("/admin", authenticate, authorize("admin"), adminDashboard);

// EXPERT DASHBOARD - Requires authentication and expert role
router.get("/expert", authenticate, authorize("expert"), expertDashboard);

export default router;
