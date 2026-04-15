import { BeneficiaryDAO } from "../models/beneficiary.model.js";

export const BeneficiaryService = {
  async list(userId) {
    const rows = await BeneficiaryDAO.listByUserId(userId);
    return { ok: true, status: 200, data: rows };
  },

  async create(payload) {
    const { userId, name, accountNumber, bankName } = payload;

    const cleanName = String(name ?? "").trim();
    const cleanAccountNumber = String(accountNumber ?? "").trim();
    const cleanBankName = String(bankName ?? "").trim();

    if (!userId) {
      return { ok: false, status: 401, error: "Utilisateur non authentifié" };
    }

    if (!cleanName) {
      return { ok: false, status: 400, error: "Le nom du bénéficiaire est obligatoire" };
    }

    if (!cleanAccountNumber) {
      return { ok: false, status: 400, error: "Le numéro de compte est obligatoire" };
    }

    const existing = await BeneficiaryDAO.findByAccountNumberAndUserId(
      cleanAccountNumber,
      userId
    );

    if (existing) {
      return {
        ok: false,
        status: 409,
        error: "Ce bénéficiaire existe déjà pour ce client",
      };
    }

    const created = await BeneficiaryDAO.create({
      userId,
      name: cleanName,
      accountNumber: cleanAccountNumber,
      bankName: cleanBankName || null,
    });

    const beneficiary = await BeneficiaryDAO.findByIdAndUserId(created.lastID, userId);

    return {
      ok: true,
      status: 201,
      data: beneficiary,
    };
  },
};