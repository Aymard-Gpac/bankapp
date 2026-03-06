import { BeneficiaryDAO } from "../models/beneficiary.model.js";

export const BeneficiaryService = {
  async list(userId) {
    const rows = await BeneficiaryDAO.listByUserId(userId);
    return { ok: true, status: 200, data: rows };
  },
};