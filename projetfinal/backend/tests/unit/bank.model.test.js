import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * Tests unitaires du AccountDAO
 * Objectif : vérifier que les requêtes SQL sont exécutées
 * avec les bons paramètres, sans toucher à une vraie DB.
 */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
  },
}));

/* =====================================================
 * Imports
 * ===================================================== */
const db = (await import("../../src/config/database.js")).default;
const { AccountDAO } = await import("../../src/models/bank.model.js");

describe("AccountDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * create
   * ===================================================== */
  describe("create", () => {
    test("appelle db.run avec tous les champs", async () => {
      db.run.mockResolvedValueOnce({ lastID: 1, changes: 1 });

      const payload = {
        client_id: 10,
        account_number: "CHEQUE-123",
        type: "cheque",
        balance: 500,
        currency: "CAD",
      };

      const res = await AccountDAO.create(payload);

      expect(db.run).toHaveBeenCalledTimes(1);

      const [sql, clientId, accNum, type, balance, currency] =
        db.run.mock.calls[0];

      expect(sql).toContain("INSERT INTO accounts");
      expect(clientId).toBe(10);
      expect(accNum).toBe("CHEQUE-123");
      expect(type).toBe("cheque");
      expect(balance).toBe(500);
      expect(currency).toBe("CAD");

      expect(res).toEqual({ lastID: 1, changes: 1 });
    });

    test("utilise balance=0 et currency=CAD par défaut", async () => {
      db.run.mockResolvedValueOnce({ lastID: 2, changes: 1 });

      await AccountDAO.create({
        client_id: 20,
        account_number: "EPARGNE-456",
        type: "epargne",
      });

      const [, , , , balance, currency] = db.run.mock.calls[0];
      expect(balance).toBe(0);
      expect(currency).toBe("CAD");
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Insert error");
      db.run.mockRejectedValueOnce(err);

      await expect(
        AccountDAO.create({
          client_id: 1,
          account_number: "ERR",
          type: "cheque",
        })
      ).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * findByClientId
   * ===================================================== */
  describe("findByClientId", () => {
    test("appelle db.all avec le bon SQL et clientId", async () => {
      db.all.mockResolvedValueOnce([{ id: 1 }]);

      const res = await AccountDAO.findByClientId(5);

      expect(db.all).toHaveBeenCalledTimes(1);

      const [sql, clientId] = db.all.mock.calls[0];
      expect(sql).toContain("FROM accounts");
      expect(sql).toContain("WHERE user_id = ?");
      expect(sql).toContain("status");
      expect(clientId).toBe(5);

      expect(res).toEqual([{ id: 1 }]);
    });

    test("retourne [] si aucun compte actif", async () => {
      db.all.mockResolvedValueOnce([]);

      const res = await AccountDAO.findByClientId(99);

      expect(res).toEqual([]);
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Select error");
      db.all.mockRejectedValueOnce(err);

      await expect(AccountDAO.findByClientId(1)).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * summaryByClientId
   * ===================================================== */
  describe("summaryByClientId", () => {
    test("retourne totalBanks et totalCurrentBalance", async () => {
      db.get.mockResolvedValueOnce({
        totalBanks: 3,
        totalCurrentBalance: 1500,
      });

      const res = await AccountDAO.summaryByClientId(5);

      const [sql, clientId] = db.get.mock.calls[0];
      expect(sql).toContain("COUNT(*)");
      expect(sql).toContain("SUM(balance)");
      expect(clientId).toBe(5);

      expect(res).toEqual({
        totalBanks: 3,
        totalCurrentBalance: 1500,
      });
    });

    test("retourne 0 si aucun compte", async () => {
      db.get.mockResolvedValueOnce({
        totalBanks: 0,
        totalCurrentBalance: 0,
      });

      const res = await AccountDAO.summaryByClientId(99);
      expect(res.totalBanks).toBe(0);
    });

    test("propage l'erreur DB", async () => {
      db.get.mockRejectedValueOnce(new Error("Summary error"));

      await expect(AccountDAO.summaryByClientId(1)).rejects.toThrow();
    });
  });

  /* =====================================================
   * findByIdAndClientId
   * ===================================================== */
  describe("findByIdAndClientId", () => {
    test("retourne le compte actif", async () => {
      const account = { id: 10, user_id: 5, status: "active" };
      db.get.mockResolvedValueOnce(account);

      const res = await AccountDAO.findByIdAndClientId(10, 5);

      const [sql, accountId, clientId] = db.get.mock.calls[0];
      expect(sql).toContain("COALESCE(status");
      expect(accountId).toBe(10);
      expect(clientId).toBe(5);

      expect(res).toEqual(account);
    });

    test("retourne null si compte inexistant ou fermé", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await AccountDAO.findByIdAndClientId(99, 5);
      expect(res).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      db.get.mockRejectedValueOnce(new Error("Find error"));

      await expect(
        AccountDAO.findByIdAndClientId(1, 1)
      ).rejects.toThrow();
    });
  });

  /* =====================================================
   * findAnyByIdAndClientId
   * ===================================================== */
  describe("findAnyByIdAndClientId", () => {
    test("retourne le compte même fermé", async () => {
      const account = { id: 10, status: "closed" };
      db.get.mockResolvedValueOnce(account);

      const res = await AccountDAO.findAnyByIdAndClientId(10, 5);

      expect(res).toEqual(account);
    });

    test("propage l'erreur DB", async () => {
      db.get.mockRejectedValueOnce(new Error("Any find error"));

      await expect(
        AccountDAO.findAnyByIdAndClientId(1, 1)
      ).rejects.toThrow();
    });
  });

  /* =====================================================
   * closeAccount
   * ===================================================== */
  describe("closeAccount", () => {
    test("appelle db.run avec id + clientId", async () => {
      db.run.mockResolvedValueOnce({ changes: 1 });

      const res = await AccountDAO.closeAccount(10, 5);

      const [sql, accountId, clientId] = db.run.mock.calls[0];
      expect(sql).toContain("UPDATE accounts");
      expect(sql).toContain("status = 'closed'");
      expect(accountId).toBe(10);
      expect(clientId).toBe(5);

      expect(res).toEqual({ changes: 1 });
    });

    test("retourne changes=0 si déjà fermé", async () => {
      db.run.mockResolvedValueOnce({ changes: 0 });

      const res = await AccountDAO.closeAccount(10, 5);
      expect(res.changes).toBe(0);
    });

    test("propage l'erreur DB", async () => {
      db.run.mockRejectedValueOnce(new Error("Close error"));

      await expect(AccountDAO.closeAccount(1, 1)).rejects.toThrow();
    });
  });

  /* =====================================================
   * updateBalance
   * ===================================================== */
  describe("updateBalance", () => {
    test("met à jour le solde", async () => {
      db.run.mockResolvedValueOnce({ changes: 1 });

      const res = await AccountDAO.updateBalance(10, 999);

      const [sql, balance, accountId] = db.run.mock.calls[0];
      expect(sql).toBe("UPDATE accounts SET balance = ? WHERE id = ?");
      expect(balance).toBe(999);
      expect(accountId).toBe(10);

      expect(res).toEqual({ changes: 1 });
    });

    test("propage l'erreur DB", async () => {
      db.run.mockRejectedValueOnce(new Error("Balance error"));

      await expect(AccountDAO.updateBalance(1, 100)).rejects.toThrow();
    });
  });

  /* =====================================================
   * findCheckingByClientId
   * ===================================================== */
  describe("findCheckingByClientId", () => {
    test("retourne le compte chèque actif", async () => {
      const account = { id: 1, type: "cheque" };
      db.get.mockResolvedValueOnce(account);

      const res = await AccountDAO.findCheckingByClientId(5);

      const [sql, clientId] = db.get.mock.calls[0];
      expect(sql).toContain("LIKE '%cheque%'");
      expect(clientId).toBe(5);

      expect(res).toEqual(account);
    });

    test("retourne null si aucun compte chèque", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await AccountDAO.findCheckingByClientId(99);
      expect(res).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      db.get.mockRejectedValueOnce(new Error("Checking error"));

      await expect(AccountDAO.findCheckingByClientId(1)).rejects.toThrow();
    });
  });
});