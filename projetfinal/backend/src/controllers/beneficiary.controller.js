import { BeneficiaryService } from "../services/beneficiary.service.js";

// GET /api/beneficiaries
export const listBeneficiaries = async (req, res) => {
  const r = await BeneficiaryService.list(req.user.id);
  return res.status(r.status).json(r.ok ? { data: r.data } : { error: r.error });
};

// POST /api/beneficiaries
export const createBeneficiary = async (req, res) => {
  const payload = {
    userId: req.user.id,
    name: req.body.name,
    accountNumber: req.body.accountNumber ?? req.body.account_number,
    bankName: req.body.bankName ?? req.body.bank_name,
  };

  const r = await BeneficiaryService.create(payload);

  return res.status(r.status).json(r.ok ? { data: r.data } : { error: r.error });
};