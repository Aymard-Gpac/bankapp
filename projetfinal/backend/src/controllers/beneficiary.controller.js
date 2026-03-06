import { BeneficiaryService } from "../services/beneficiary.service.js";

// GET /api/beneficiaries
export const listBeneficiaries = async (req, res) => {
  const r = await BeneficiaryService.list(req.user.id);
  return res.status(r.status).json(r.ok ? { data: r.data } : { error: r.error });
};