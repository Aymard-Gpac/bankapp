import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import bankRoutes from "./routes/bank.routes.js";
import transferRoutes from "./routes/transfer.routes.js";
import beneficiaryRoutes from "./routes/beneficiary.routes.js";
import cookieParser from "cookie-parser";

export function createApp() {
  const app = express();

  const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:3001",
  ];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRoutes);

  app.use("/api/clients", bankRoutes);

  app.use("/api/clients", clientRoutes);

  app.use("/api/transfers", transferRoutes);

  app.use("/api/beneficiaries", beneficiaryRoutes);
  return app;
}
