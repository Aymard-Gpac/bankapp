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

  app.use(
    cors({
      origin: "http://localhost:3000",
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
