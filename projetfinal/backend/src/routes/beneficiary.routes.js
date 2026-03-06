import { Router } from "express";
import { requireRoles, verifyToken } from "../middlewares/auth.middleware.js";
import { listBeneficiaries } from "../controllers/beneficiary.controller.js";

const router = Router();

router.get("/", verifyToken, requireRoles("client"), listBeneficiaries);

export default router;