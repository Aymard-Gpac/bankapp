import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * Tests unitaires du BeneficiaryDAO
 * Objectif : vérifier les requêtes SQL et les paramètres transmis à la DB
 * La base de données réelle n'est jamais utilisée.
 */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn(),
  },
}));

/* ============================
 * Imports
 * ============================ */
const db = (await import("../../src/config/database.js")).default;
const { BeneficiaryDAO } = await import("../../src/models/beneficiary.model.js");

describe("BeneficiaryDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * listByUserId
   * ===================================================== */
  describe("listByUserId", () => {
    test("appelle db.all avec le bon SQL + userId", async () => {
      db.all.mockResolvedValueOnce([{ id: 1 }]);

      const res = await BeneficiaryDAO.listByUserId(5);

      expect(db.all).toHaveBeenCalledTimes(1);

      const [sql, userId] = db.all.mock.calls[0];
      expect(sql).toContain("FROM beneficiaries");
      expect(sql).toContain("WHERE user_id = ?");
      expect(userId).toBe(5);

      expect(res).toEqual([{ id: 1 }]);
    });

    test("retourne un tableau vide si aucun bénéficiaire", async () => {
      db.all.mockResolvedValueOnce([]);

      const res = await BeneficiaryDAO.listByUserId(99);

      expect(res).toEqual([]);
    });

    test("propage une erreur DB", async () => {
      const err = new Error("DB error");
      db.all.mockRejectedValueOnce(err);

      await expect(BeneficiaryDAO.listByUserId(5)).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * findByIdAndUserId
   * ===================================================== */
  describe("findByIdAndUserId", () => {
    test("appelle db.get avec id + userId", async () => {
      db.get.mockResolvedValueOnce({ id: 3, user_id: 5 });

      const res = await BeneficiaryDAO.findByIdAndUserId(3, 5);

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, id, userId] = db.get.mock.calls[0];
      expect(sql).toContain("WHERE id = ? AND user_id = ?");
      expect(id).toBe(3);
      expect(userId).toBe(5);

      expect(res).toEqual({ id: 3, user_id: 5 });
    });

    test("retourne null si bénéficiaire introuvable", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await BeneficiaryDAO.findByIdAndUserId(99, 5);

      expect(res).toBeNull();
    });

    test("propage une erreur DB", async () => {
      const err = new Error("DB error");
      db.get.mockRejectedValueOnce(err);

      await expect(
        BeneficiaryDAO.findByIdAndUserId(3, 5)
      ).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * findByAccountNumberAndUserId
   * ===================================================== */
  describe("findByAccountNumberAndUserId", () => {
    test("appelle db.get avec accountNumber + userId", async () => {
      db.get.mockResolvedValueOnce({
        id: 7,
        user_id: 5,
        account_number: "VISA-123",
      });

      const res = await BeneficiaryDAO.findByAccountNumberAndUserId(
        "VISA-123",
        5
      );

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, accountNumber, userId] = db.get.mock.calls[0];
      expect(sql).toContain("WHERE account_number = ? AND user_id = ?");
      expect(accountNumber).toBe("VISA-123");
      expect(userId).toBe(5);

      expect(res).toEqual({
        id: 7,
        user_id: 5,
        account_number: "VISA-123",
      });
    });

    test("retourne null si aucun bénéficiaire correspondant", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await BeneficiaryDAO.findByAccountNumberAndUserId(
        "UNKNOWN",
        5
      );

      expect(res).toBeNull();
    });

    test("propage une erreur DB", async () => {
      const err = new Error("DB error");
      db.get.mockRejectedValueOnce(err);

      await expect(
        BeneficiaryDAO.findByAccountNumberAndUserId("VISA-123", 5)
      ).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * create
   * ===================================================== */
  describe("create", () => {
    test("appelle db.run avec bankName fourni", async () => {
      db.run.mockResolvedValueOnce({ lastID: 10, changes: 1 });

      const res = await BeneficiaryDAO.create({
        userId: 5,
        name: "Visa",
        accountNumber: "VISA-5-003",
        bankName: "Visa Bank",
      });

      expect(db.run).toHaveBeenCalledTimes(1);

      const [sql, userId, name, accountNumber, bankName] =
        db.run.mock.calls[0];

      expect(sql).toContain("INSERT INTO beneficiaries");
      expect(userId).toBe(5);
      expect(name).toBe("Visa");
      expect(accountNumber).toBe("VISA-5-003");
      expect(bankName).toBe("Visa Bank");

      expect(res).toEqual({ lastID: 10, changes: 1 });
    });

    test("appelle db.run avec bankName null si manquant", async () => {
      db.run.mockResolvedValueOnce({ lastID: 11, changes: 1 });

      const res = await BeneficiaryDAO.create({
        userId: 5,
        name: "Hydro",
        accountNumber: "HYDRO-001",
        bankName: undefined,
      });

      const [, , , , bankName] = db.run.mock.calls[0];
      expect(bankName).toBeNull();

      expect(res).toEqual({ lastID: 11, changes: 1 });
    });

    test("propage une erreur DB lors de l'insertion", async () => {
      const err = new Error("Insert error");
      db.run.mockRejectedValueOnce(err);

      await expect(
        BeneficiaryDAO.create({
          userId: 5,
          name: "Erreur",
          accountNumber: "ERR",
        })
      ).rejects.toThrow(err);
    });
  });
});
