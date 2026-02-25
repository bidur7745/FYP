import { createUser, verifyUser, loginUser, requestPasswordReset, verifyPasswordResetOTP as verifyPasswordResetOTPService, resetPassword, getUserProfile, updateUserProfile, listAllUsers, listExperts, setExpertVerified, deleteUser } from "../services/userService.js";

export const registerUser = async (req, res) => {
    try {
      const { name, email, password, phone, address, role } = req.body;
  
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and password are required.",
        });
      }
  
      const result = await createUser({
        name,
        email,
        password,
        phone,
        address,
        role: role || "user",
      });
  
      return res.status(201).json({
        success: true,
        message: "Registration successful. Please check your email for verification OTP.",
        data: result,
      });
  
    } catch (error) {
      console.error("Register Error:", error.message);
  
      // Handle password validation errors
      if (error.message.includes("Password must")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
  
      // Handle duplicate email gracefully
      if (error.message.includes("Email already registered")) {
        return res.status(400).json({
          success: false,
          message: "This email is already registered. Please login instead.",
        });
      }
  
      // Handle email sending errors
      if (error.message.includes("Failed to send verification email")) {
        return res.status(500).json({
          success: false,
          message: "User created but failed to send verification email. Please contact support.",
          error: error.message,
        });
      }
  
      return res.status(500).json({
        success: false,
        message: "Something went wrong while registering the user.",
        error: error.message,
      });
    }
  };

export const verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required.",
        });
      }
  
      const result = await verifyUser(email, otp);
  
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.user,
      });
  
    } catch (error) {
      console.error("Verify OTP Error:", error.message);
  
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid or expired OTP",
      });
    }
  };

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
      }
  
      const result = await loginUser(email, password);
  
      return res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        data: result.user,
      });
  
    } catch (error) {
      console.error("Login Error:", error.message);
  
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid credentials",
      });
    }
  };

// Dashboard controller for expert role
export const expertDashboard = async (req, res) => {
  try {
    // This is a protected route - user is attached to req.user by auth middleware
    return res.status(200).json({
      success: true,
      message: "Welcome to Expert Dashboard",
      data: {
        user: req.user,
        dashboard: "expert",
      },
    });
  } catch (error) {
    console.error("Expert Dashboard Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error accessing dashboard",
    });
  }
};

// FORGOT PASSWORD CONTROLLER (Step 1)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const result = await requestPasswordReset(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error("Forgot Password Error:", error.message);

    if (error.message.includes("Failed to send password reset email")) {
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while processing your request.",
      error: error.message,
    });
  }
};

// VERIFY PASSWORD RESET OTP CONTROLLER (Step 2)
export const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const result = await verifyPasswordResetOTPService(email, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error("Verify Password Reset OTP Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying OTP.",
      error: error.message,
    });
  }
};

// RESET PASSWORD CONTROLLER (Step 3)
export const resetPasswordController = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    const result = await resetPassword(email, otp, newPassword);

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error("Reset Password Error:", error.message);

    // Handle password validation errors
    if (error.message.includes("Password must")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle invalid/expired OTP
    if (error.message.includes("Invalid or expired OTP") || error.message.includes("User not found")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting your password.",
      error: error.message,
    });
  }
};

// GET USER PROFILE CONTROLLER
export const getUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserProfile(userId);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get User Profile Error:", error.message);

    if (error.message.includes("User not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
      error: error.message,
    });
  }
};

// UPDATE USER PROFILE CONTROLLER
export const updateUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phone,
      address,
      farmLocation,
      bio,
      profileImage,
      licenseImage,
      skills,
      education,
      yearsOfExperience,
    } = req.body;

    // At least one field should be provided
    if (
      !name &&
      phone === undefined &&
      address === undefined &&
      farmLocation === undefined &&
      bio === undefined &&
      profileImage === undefined &&
      licenseImage === undefined &&
      skills === undefined &&
      education === undefined &&
      yearsOfExperience === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided for update",
      });
    }

    const result = await updateUserProfile(userId, {
      name,
      phone,
      address,
      farmLocation,
      bio,
      profileImage,
      licenseImage,
      skills,
      education,
      yearsOfExperience,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update User Profile Error:", error.message);

    if (
      error.message.includes("Invalid farm location") ||
      error.message.includes("Name must be")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user profile",
      error: error.message,
    });
  }
};

// LIST ALL USERS (admin only) - farmers + experts (exclude password)
export const listAllUsersController = async (req, res) => {
  try {
    const users = await listAllUsers();
    const safeUsers = users.map(({ password, ...rest }) => rest);
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: safeUsers,
    });
  } catch (error) {
    console.error("List all users error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to list users",
    });
  }
};

// LIST EXPERTS (admin only)
export const listExpertsController = async (req, res) => {
  try {
    const experts = await listExperts();
    return res.status(200).json({
      success: true,
      message: "Experts retrieved successfully",
      data: experts,
    });
  } catch (error) {
    console.error("List experts error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to list experts",
    });
  }
};

// VERIFY / REJECT EXPERT (admin only) - set isVerifiedExpert to true or false
// PATCH body: { verified: true } to approve, { verified: false } to reject
export const verifyExpertController = async (req, res) => {
  try {
    const { userId } = req.params;
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const verified = req.body?.verified !== false; // default true for backward compatibility
    const result = await setExpertVerified(id, verified);
    return res.status(200).json({
      success: true,
      message: verified ? "Expert verified successfully" : "Expert verification rejected",
      data: result,
    });
  } catch (error) {
    console.error("Verify expert error:", error.message);
    if (error.message.includes("User details not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify expert",
    });
  }
};

// DELETE OWN PROFILE (authenticated user deletes their own account)
export const deleteMyProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    await deleteUser(userId);
    return res.status(200).json({
      success: true,
      message: "Your account has been deleted successfully",
    });
  } catch (error) {
    console.error("Delete my profile error:", error.message);
    if (error.message.includes("User not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete account",
    });
  }
};

// DELETE USER (admin only)
export const deleteUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    await deleteUser(id);
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    if (error.message.includes("User not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};
