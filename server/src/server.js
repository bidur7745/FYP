import http from "http";
import activeBackend, {
  runMarketPriceScrapeIfNeeded,
  marketPriceScrapeJob,
} from "./config/cron.js";
import express from "express";
import { ENV } from "./config/env.js";
import { attachChatSocket } from "./socket/chatSocket.js";
import userRoutes from "./routes/userRoute.js";
import cropAdvisoryRoutes from "./routes/cropAdvisoryRoute.js";
import weatherRoutes from "./routes/weatherRoute.js";
import alertRoutes from "./routes/alertRoute.js";
import governmentSchemeRoutes from "./routes/governmentSchemeRoute.js";
import uploadRoutes from "./routes/uploadRoute.js";
import supportQueriesRoutes from "./routes/supportQueriesRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import marketPriceRoutes from "./routes/marketPriceRoute.js";
import diseaseRoutes from "./routes/diseaseRoute.js";
import subscriptionRoutes from "./routes/subscriptionRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import agroRecommendationRoutes from "./routes/agroRecommendationRoute.js";
import testAlertRoutes from "./test/testAlertRoute.js";
import cors from "cors";

const server = express();
const PORT = ENV.PORT;

// Middlewares
server.use(
  cors({
    origin: ENV.CORS_ORIGINS,
    credentials: true,
  })
);
server.use(express.json());

// Keep backend alive on production (cron job)
if (ENV.NODE_ENV === "production") {
  activeBackend.start();
  marketPriceScrapeJob.start();
}

// Health check route
server.get("/", (req, res) => {
  res.send("API is running...."); 
});

// Mount user routes
server.use("/api/users", userRoutes);


// Mount crop advisory routes
server.use("/api", cropAdvisoryRoutes);



// Mount weather routes
server.use("/api/weather", weatherRoutes);


// Mount alert routes
server.use("/api/alerts", alertRoutes);


// Mount government scheme routes
server.use("/api/government-schemes", governmentSchemeRoutes);

// Mount upload routes (authenticated)
server.use("/api/upload", uploadRoutes);

// Mount support/contact form and notifications
server.use("/api/support", supportQueriesRoutes);
server.use("/api/notifications", notificationRoutes);
server.use("/api/market-prices", marketPriceRoutes);
server.use("/api/disease", diseaseRoutes);
server.use("/api/subscription", subscriptionRoutes);
server.use("/api/chat", chatRoutes);
server.use("/api/agro-recommendations", agroRecommendationRoutes);

// Mount dashboard routes (protected)
server.use("/dashboard", userRoutes);

// Mount test routes (dev only) – weather alert scenarios
if (ENV.NODE_ENV !== "production") {
  server.use("/api/test", testAlertRoutes);
}

// Create HTTP server and attach Socket.IO for chat
const httpServer = http.createServer(server);
attachChatSocket(httpServer);

httpServer.listen(PORT, async () => {
  console.log(`Server running → ${ENV.BACKEND_URL}`);
  await runMarketPriceScrapeIfNeeded();
});