import { CheckDepositService } from "../services/check-deposit.service.js";

export const CheckDepositController = {
  async create(req, res, next) {
    try {
      const clientId = Number(req.params.clientId);

      if (Number.isNaN(clientId)) {
        return res.status(400).json({ error: "Invalid clientId" });
      }

      if (req.user?.role === "client" && Number(req.user.id) !== clientId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const result = await CheckDepositService.createCheckDeposit({
        clientId,
        imageName: req.body?.imageName,
        imageType: req.body?.imageType,
        imageSize: req.body?.imageSize,
        qrCode: req.body?.qrCode,
        amount: req.body?.amount,
      });

      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.status(result.status).json(result.data);
    } catch (error) {
      next(error);
    }
  },
};