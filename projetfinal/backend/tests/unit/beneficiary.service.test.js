import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * On mock le DAO pour tester uniquement la logique métier du service.
 */
jest.unstable_mockModule("../../src/models/beneficiary.model.js", () => ({
  __esModule: true,
  BeneficiaryDAO: {
    listByUserId: jest.fn(),
    findByAccountNumberAndUserId: jest.fn(),
    create: jest.fn(),
    findByIdAndUserId: jest.fn(),
  },
}));

/* =====================================================
 * Imports
 * ===================================================== */
const { BeneficiaryService } = await import(
  "../../src/services/beneficiary.service.js"
);
const { BeneficiaryDAO } = await import(
  "../../src/models/beneficiary.model.js"
);

describe("BeneficiaryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * list
   * ===================================================== */
  describe("list", () => {
    test("retourne la liste des bénéficiaires (200)", async () => {
      BeneficiaryDAO.listByUserId.mockResolvedValueOnce([
        { id: 1, user_id: 10, name: "Hydro" },
      ]);

      const res = await BeneficiaryService.list(10);

      expect(BeneficiaryDAO.listByUserId).toHaveBeenCalledWith(10);
      expect(res).toEqual({
        ok: true,
        status: 200,
        data: [{ id: 1, user_id: 10, name: "Hydro" }],
      });
    });

    test("propage l'erreur si le DAO échoue", async () => {
      BeneficiaryDAO.listByUserId.mockRejectedValueOnce(
        new Error("DB error")
      );

      await expect(BeneficiaryService.list(10)).rejects.toThrow("DB error");
    });
  });

  /* =====================================================
   * create
   * ===================================================== */
  describe("create", () => {
    test("401 si utilisateur non authentifié", async () => {
      const res = await BeneficiaryService.create({
        userId: null,
        name: "Hydro",
        accountNumber: "HQ-01",
      });

      expect(res).toEqual({
        ok: false,
        status: 401,
        error: "Utilisateur non authentifié",
      });
    });

    test("400 si nom manquant ou vide après trim", async () => {
      const res = await BeneficiaryService.create({
        userId: 1,
        name: "   ",
        accountNumber: "HQ-01",
      });

      expect(res).toEqual({
        ok: false,
        status: 400,
        error: "Le nom du bénéficiaire est obligatoire",
      });
    });

    test("400 si numéro de compte manquant ou vide après trim", async () => {
      const res = await BeneficiaryService.create({
        userId: 1,
        name: "Hydro",
        accountNumber: "   ",
      });

      expect(res).toEqual({
        ok: false,
        status: 400,
        error: "Le numéro de compte est obligatoire",
      });
    });

    test("409 si le bénéficiaire existe déjà pour ce client", async () => {
      BeneficiaryDAO.findByAccountNumberAndUserId.mockResolvedValueOnce({
        id: 5,
      });

      const res = await BeneficiaryService.create({
        userId: 1,
        name: "Hydro",
        accountNumber: "HQ-01",
      });

      expect(
        BeneficiaryDAO.findByAccountNumberAndUserId
      ).toHaveBeenCalledWith("HQ-01", 1);

      expect(res).toEqual({
        ok: false,
        status: 409,
        error: "Ce bénéficiaire existe déjà pour ce client",
      });
    });

    test("201 crée le bénéficiaire avec champs nettoyés", async () => {
      BeneficiaryDAO.findByAccountNumberAndUserId.mockResolvedValueOnce(null);
      BeneficiaryDAO.create.mockResolvedValueOnce({ lastID: 42 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValueOnce({
        id: 42,
        user_id: 1,
        name: "Hydro",
        account_number: "HQ-01",
        bank_name: null,
      });

      const res = await BeneficiaryService.create({
        userId: 1,
        name: "  Hydro ",
        accountNumber: " HQ-01 ",
        bankName: "   ",
      });

      expect(BeneficiaryDAO.create).toHaveBeenCalledWith({
        userId: 1,
        name: "Hydro",
        accountNumber: "HQ-01",
        bankName: null,
      });

      expect(BeneficiaryDAO.findByIdAndUserId).toHaveBeenCalledWith(42, 1);

      expect(res).toEqual({
        ok: true,
        status: 201,
        data: {
          id: 42,
          user_id: 1,
          name: "Hydro",
          account_number: "HQ-01",
          bank_name: null,
        },
      });
    });

    test("propage l'erreur si create DAO échoue", async () => {
      BeneficiaryDAO.findByAccountNumberAndUserId.mockResolvedValueOnce(null);
      BeneficiaryDAO.create.mockRejectedValueOnce(
        new Error("Insert error")
      );

      await expect(
        BeneficiaryService.create({
          userId: 1,
          name: "Hydro",
          accountNumber: "HQ-01",
        })
      ).rejects.toThrow("Insert error");
    });

    test("propage l'erreur si findByIdAndUserId échoue après création", async () => {
      BeneficiaryDAO.findByAccountNumberAndUserId.mockResolvedValueOnce(null);
      BeneficiaryDAO.create.mockResolvedValueOnce({ lastID: 10 });
      BeneficiaryDAO.findByIdAndUserId.mockRejectedValueOnce(
        new Error("Select error")
      );

      await expect(
        BeneficiaryService.create({
          userId: 1,
          name: "Hydro",
          accountNumber: "HQ-01",
        })
      ).rejects.toThrow("Select error");
    });
  });
});
