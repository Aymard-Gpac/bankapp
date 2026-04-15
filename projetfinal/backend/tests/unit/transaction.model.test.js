import { jest, describe, test, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn(),
  },
}));

/* =====================================================
 * Imports
 * ===================================================== */
const db = (await import("../../src/config/database.js")).default;
const { TransactionDAO } = await import("../../src/models/transaction.model.js");

describe("TransactionDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * findByAccountIdPaginated
   * ===================================================== */
  describe("findByAccountIdPaginated", () => {
    test("appelle db.all avec SQL, limit et offset", async () => {
      db.all.mockResolvedValueOnce([{ id: 1 }]);

      const res = await TransactionDAO.findByAccountIdPaginated(10, 5, 0);

      const [sql, accountId, limit, offset] = db.all.mock.calls[0];
      expect(sql).toContain("FROM transactions");
      expect(accountId).toBe(10);
      expect(limit).toBe(5);
      expect(offset).toBe(0);
      expect(res).toEqual([{ id: 1 }]);
    });

    test("retourne [] si aucune transaction", async () => {
      db.all.mockResolvedValueOnce([]);
      const res = await TransactionDAO.findByAccountIdPaginated(1, 10, 0);
      expect(res).toEqual([]);
    });

    test("propage erreur DB", async () => {
      db.all.mockRejectedValueOnce(new Error("DB error"));
      await expect(
        TransactionDAO.findByAccountIdPaginated(1, 10, 0)
      ).rejects.toThrow();
    });
  });

  /* =====================================================
   * countByAccountId
   * ===================================================== */
  describe("countByAccountId", () => {
    test("retourne le total", async () => {
      db.get.mockResolvedValueOnce({ total: 5 });

      const res = await TransactionDAO.countByAccountId(10);

      const [sql, accountId] = db.get.mock.calls[0];
      expect(sql).toContain("COUNT(*)");
      expect(accountId).toBe(10);
      expect(res).toEqual({ total: 5 });
    });

    test("propage erreur DB", async () => {
      db.get.mockRejectedValueOnce(new Error("Count error"));
      await expect(TransactionDAO.countByAccountId(1)).rejects.toThrow();
    });
  });

  /* =====================================================
   * findHistoryByClientId
   * ===================================================== */
  describe("findHistoryByClientId", () => {
    test("retourne l'historique", async () => {
      db.all.mockResolvedValueOnce([{ id: 1 }]);

      const res = await TransactionDAO.findHistoryByClientId(123);

      const [sql, clientId] = db.all.mock.calls[0];
      expect(sql).toContain("FROM transactions t");
      expect(clientId).toBe(123);
      expect(res).toEqual([{ id: 1 }]);
    });

    test("propage erreur DB", async () => {
      db.all.mockRejectedValueOnce(new Error("History error"));
      await expect(TransactionDAO.findHistoryByClientId(1)).rejects.toThrow();
    });
  });

  /* =====================================================
   * create
   * ===================================================== */
  describe("create", () => {
    test("crée une transaction avec date générée automatiquement", async () => {
      db.run.mockResolvedValueOnce({ lastID: 42 });
      db.get.mockResolvedValueOnce({ id: 42, amount: 100 });

      const res = await TransactionDAO.create({
        accountId: 10,
        type: "CREDIT",
        amount: 100,
        description: "Test",
      });

      expect(db.run).toHaveBeenCalledTimes(1);
      expect(db.get).toHaveBeenCalledWith(
        "SELECT * FROM transactions WHERE id = ?",
        42
      );

      expect(res).toEqual({ id: 42, amount: 100 });
    });

    test("crée une transaction avec createdAt fourni", async () => {
      db.run.mockResolvedValueOnce({ lastID: 50 });
      db.get.mockResolvedValueOnce({ id: 50 });

      const createdAt = "2026-01-01 10:00:00";

      await TransactionDAO.create({
        accountId: 5,
        type: "DEBIT",
        amount: 25,
        description: "Paiement",
        createdAt,
      });

      const [, , , , , passedCreatedAt] = db.run.mock.calls[0];
      expect(passedCreatedAt).toBe(createdAt);
    });

    test("description null si non fournie", async () => {
      db.run.mockResolvedValueOnce({ lastID: 99 });
      db.get.mockResolvedValueOnce({ id: 99, description: null });

      const res = await TransactionDAO.create({
        accountId: 1,
        type: "DEBIT",
        amount: 50,
      });

      const [, , , , description] = db.run.mock.calls[0];
      expect(description).toBeNull();
      expect(res.description).toBeNull();
    });

    test("propage erreur db.run", async () => {
      db.run.mockRejectedValueOnce(new Error("Insert error"));

      await expect(
        TransactionDAO.create({
          accountId: 1,
          type: "CREDIT",
          amount: 10,
        })
      ).rejects.toThrow();
    });

    test("propage erreur db.get après insertion", async () => {
      db.run.mockResolvedValueOnce({ lastID: 77 });
      db.get.mockRejectedValueOnce(new Error("Select error"));

      await expect(
        TransactionDAO.create({
          accountId: 1,
          type: "CREDIT",
          amount: 10,
        })
      ).rejects.toThrow("Select error");
    });
  });
});

