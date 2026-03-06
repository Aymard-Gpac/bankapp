import { Router } from "express";
import { requireRoles, verifyToken } from "../middlewares/auth.middleware.js";
import { TransferController } from "../controllers/transfer.controller.js";
import { payBill } from "../controllers/transfer.controller.js";

const router = Router();

// POST /api/transfers/internal
router.post("/internal", verifyToken ,requireRoles("client"), TransferController.createInternalTransfer);
router.post("/interac", verifyToken ,requireRoles("client"), TransferController.createInteracTransfer);
router.post("/bills", verifyToken, requireRoles("client"), payBill);
export default router;