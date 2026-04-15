import { Router } from "express";
import { requireRoles, verifyToken } from "../middlewares/auth.middleware.js";
import { listBeneficiaries, createBeneficiary } from "../controllers/beneficiary.controller.js";

const router = Router();

router.get("/", verifyToken, requireRoles("client"), listBeneficiaries);
router.post("/", verifyToken, requireRoles("client"), createBeneficiary);
export default router;