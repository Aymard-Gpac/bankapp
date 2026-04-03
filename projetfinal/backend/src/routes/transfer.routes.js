import { Router } from "express";
import { requireRoles, verifyToken } from "../middlewares/auth.middleware.js";
import { TransferController } from "../controllers/transfer.controller.js";
import { payBill } from "../controllers/transfer.controller.js";

const router = Router();

// POST /api/transfers/internal
router.post("/internal", verifyToken ,requireRoles("client"), TransferController.createInternalTransfer);
router.post("/interac", verifyToken ,requireRoles("client"), TransferController.createInteracTransfer);
router.post("/bills", verifyToken, requireRoles("client"), payBill);
router.post("/scheduled/process-due", verifyToken , requireRoles("client"), TransferController.processDueScheduledTransactions);
router.get("/scheduled", verifyToken,requireRoles("client"),TransferController.getScheduledTransactions);
router.patch("/scheduled/:id/cancel", verifyToken , requireRoles("client"),TransferController.cancelScheduledTransaction);
export default router;