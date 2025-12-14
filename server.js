// import express from "express";
// import "dotenv/config";
// import connectDB from "./database/db.js";
// import userRoute from "./routes/userRoute.js";
// import productRoute from "./routes/productRoute.js";
// import cartRoute from "./routes/cartRoute.js";
// import orderRoute from "./routes/orderRoute.js";
// import cors from "cors";

// import path from "path";
// import { fileURLToPath } from "url";

// /** ---------- ESM __dirname setup ---------- */
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 3000;

// //middleware
// app.use(express.json());
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     methods: ["POST", "GET", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.use("/uploads", express.static("uploads"));

// app.use("/api/v1/user", userRoute);
// app.use("/api/v1/product", productRoute);
// app.use("/api/v1/cart", cartRoute);
// app.use("/api/v1/orders", orderRoute);

// /** ---------- Serve Frontend in PRODUCTION ---------- */
// if (process.env.NODE_ENV === "production") {
//   // 👉 If using Vite: frontend/dist
//   const frontendPath = path.join(__dirname, "frontend", "dist");

//   // 👉 If using CRA instead, use:
//   // const frontendPath = path.join(__dirname, "frontend", "build");

//   // Serve static assets
//   app.use(express.static(frontendPath));

//   // Fallback: any non-API route → index.html
//   app.use((req, res, next) => {
//     if (req.originalUrl.startsWith("/api")) {
//       return next(); // let API routes continue to 404 handler if not matched
//     }
//     return res.sendFile(path.join(frontendPath, "index.html"));
//   });
// } else {
//   // Simple dev root route
//   app.get("/", (req, res) => {
//     res.send("Backend running (dev) 🚀");
//   });
// }

// app.listen(PORT, () => {
//   connectDB();
//   console.log(`Server is listening at port:${PORT}`);
// });

////////////////////////////////////////////////////////////////////////////////////////////////////

import express from "express";
import "dotenv/config";
import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";
import orderRoute from "./routes/orderRoute.js";
import cors from "cors";
import helmet from "helmet";
import arcjet, { shield, slidingWindow, detectBot } from "@arcjet/node";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";

/** ---------- ESM __dirname setup ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to DB once on startup
// Connect to DB once on startup
connectDB();

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"], // Track requests by IP
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE", 
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 100,
    }),
  ],
});

// Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ error: "Too many requests" });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: "No bots allowed" });
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    next();
  } catch (error) {
    console.error("Arcjet error", error);
    next(error);
  }
});

app.use(express.json());
app.use(
  cors({
    origin: "https://e-commerce-frontend-two-delta.vercel.app",
    credentials: true,
  })
);

// Static files (keep if you need /uploads; otherwise, remove for pure API)
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/orders", orderRoute);

// Optional: Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is running" });
});

// Export for Vercel
export default app;
