import { Router } from "express";
import { registerUser, verifyOTP, login, forgotPassword, verifyPasswordResetOTP, resetPasswordController, expertDashboard, getUserProfileController, updateUserProfileController, listAllUsersController, listExpertsController, verifyExpertController, deleteUserController } from "../controllers/userController.js";
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
// EXPERT DASHBOARD - Requires authentication and expert role
router.get("/expert", authenticate, authorize("expert"), expertDashboard);

// USER PROFILE ROUTES (Protected - requires authentication)
// Get user profile
router.get("/profile", authenticate, getUserProfileController);

// Update user profile
router.put("/profile", authenticate, updateUserProfileController);

// ADMIN: List all users (farmers + experts)
router.get("/all", authenticate, authorize("admin"), listAllUsersController);
// ADMIN: List experts (for verification)
router.get("/experts", authenticate, authorize("admin"), listExpertsController);
// ADMIN: Verify expert (set isVerifiedExpert = true)
router.patch("/:userId/verify-expert", authenticate, authorize("admin"), verifyExpertController);
// ADMIN: Delete user
router.delete("/:userId", authenticate, authorize("admin"), deleteUserController);

export default router;
