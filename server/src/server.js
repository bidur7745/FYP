import activeBackend from "./config/cron.js";
import express from "express";
import { ENV } from "./config/env.js";
import userRoutes from "./routes/userRoute.js";
import cors from "cors";

const server = express();
const PORT = ENV.PORT;

// Middlewares
server.use(
  cors({
    origin: ENV.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
server.use(express.json());

// Keep backend alive on production (cron job)
if (ENV.NODE_ENV === "production") activeBackend.start();

// Health check route
server.get("/", (req, res) => {
  res.send("API is running...."); 
});

// Mount user routes
server.use("/api/users", userRoutes);
// Example: POST http://localhost:5000/api/users/register

// Mount dashboard routes (protected)
server.use("/dashboard", userRoutes);
// Example: GET http://localhost:5000/dashboard/user (requires token)

// Start server
server.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});



