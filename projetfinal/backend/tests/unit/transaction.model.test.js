import { jest, describe, test, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn(),
  },
}));

const db = (await import("../../src/config/database.js")).default;
const { TransactionDAO } = await import("../../src/models/transaction.model.js");

describe("TransactionDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByAccountIdPaginated", () => {
    test("appelle db.all avec le bon SQL, limit et offset", async () => {
      const fakeRows = [
        { id: 1, account_id: 10, amount: 100, type: "CREDIT" },
        { id: 2, account_id: 10, amount: 50, type: "DEBIT" },
      ];

      db.all.mockResolvedValueOnce(fakeRows);

      const result = await TransactionDAO.findByAccountIdPaginated(10, 5, 0);

      expect(db.all).toHaveBeenCalledTimes(1);

      const [sql, accountId, limit, offset] = db.all.mock.calls[0];

      expect(sql).toContain("FROM transactions");
      expect(sql).toContain("WHERE account_id = ?");
      expect(sql).toContain("LIMIT ? OFFSET ?");
      expect(accountId).toBe(10);
      expect(limit).toBe(5);
      expect(offset).toBe(0);
      expect(result).toEqual(fakeRows);
    });

    test("retourne un tableau vide si aucune transaction paginée n'existe", async () => {
      db.all.mockResolvedValueOnce([]);

      const result = await TransactionDAO.findByAccountIdPaginated(99, 10, 20);

      expect(result).toEqual([]);
    });

    test("propage l'erreur si db.all échoue sur la pagination", async () => {
      const dbError = new Error("Pagination DB error");
      db.all.mockRejectedValueOnce(dbError);

      await expect(
        TransactionDAO.findByAccountIdPaginated(10, 10, 0)
      ).rejects.toThrow(dbError);
    });
  });

  describe("countByAccountId", () => {
    test("appelle db.get avec la bonne requête SQL", async () => {
      db.get.mockResolvedValueOnce({ total: 7 });

      const result = await TransactionDAO.countByAccountId(10);

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, accountId] = db.get.mock.calls[0];

      expect(sql).toContain("SELECT COUNT(*) AS total");
      expect(sql).toContain("FROM transactions");
      expect(sql).toContain("WHERE account_id = ?");
      expect(accountId).toBe(10);
      expect(result).toEqual({ total: 7 });
    });

    test("retourne total 0 si aucune transaction n'existe", async () => {
      db.get.mockResolvedValueOnce({ total: 0 });

      const result = await TransactionDAO.countByAccountId(999);

      expect(result).toEqual({ total: 0 });
    });

    test("propage l'erreur si db.get échoue", async () => {
      const dbError = new Error("Count DB error");
      db.get.mockRejectedValueOnce(dbError);

      await expect(TransactionDAO.countByAccountId(10)).rejects.toThrow(dbError);
    });
  });

  describe("findHistoryByClientId", () => {
    test("appelle db.all avec la bonne requête SQL et le bon clientId", async () => {
      const fakeRows = [
        {
          id: 1,
          account_id: 10,
          account_type: "cheque",
          account_number: "CHEQUE-123",
          description: "Salaire",
          amount: 1500,
          type: "CREDIT",
          created_at: "2026-03-10T12:00:00Z",
        },
      ];

      db.all.mockResolvedValueOnce(fakeRows);

      const result = await TransactionDAO.findHistoryByClientId(123);

      expect(db.all).toHaveBeenCalledTimes(1);

      const [sql, clientId] = db.all.mock.calls[0];

      expect(sql).toContain("FROM transactions t");
      expect(sql).toContain("INNER JOIN accounts a ON a.id = t.account_id");
      expect(sql).toContain("WHERE a.user_id = ?");
      expect(sql).toContain("ORDER BY t.created_at DESC");
      expect(clientId).toBe(123);
      expect(result).toEqual(fakeRows);
    });

    test("retourne un tableau vide si aucune transaction d'historique n'existe", async () => {
      db.all.mockResolvedValueOnce([]);

      const result = await TransactionDAO.findHistoryByClientId(999);

      expect(result).toEqual([]);
    });

    test("propage l'erreur si db.all échoue sur l'historique", async () => {
      const dbError = new Error("History DB error");
      db.all.mockRejectedValueOnce(dbError);

      await expect(TransactionDAO.findHistoryByClientId(123)).rejects.toThrow(
        dbError
      );
    });
  });

  describe("create", () => {
    test("insère une transaction puis retourne la transaction créée", async () => {
      db.run.mockReturnValueOnce({ lastID: 42 });
      db.get.mockResolvedValueOnce({
        id: 42,
        account_id: 10,
        type: "CREDIT",
        amount: 250,
        description: "Dépôt test",
      });

      const result = await TransactionDAO.create({
        accountId: 10,
        type: "CREDIT",
        amount: 250,
        description: "Dépôt test",
      });

      expect(db.run).toHaveBeenCalledTimes(1);

      const [insertSql, accountId, type, amount, description] = db.run.mock.calls[0];
      expect(insertSql).toContain(
        "INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)"
      );
      expect(accountId).toBe(10);
      expect(type).toBe("CREDIT");
      expect(amount).toBe(250);
      expect(description).toBe("Dépôt test");

      expect(db.get).toHaveBeenCalledTimes(1);
      expect(db.get).toHaveBeenCalledWith(
        "SELECT * FROM transactions WHERE id = ?",
        42
      );

      expect(result).toEqual({
        id: 42,
        account_id: 10,
        type: "CREDIT",
        amount: 250,
        description: "Dépôt test",
      });
    });

    test("insère une transaction avec description null si non fournie", async () => {
      db.run.mockReturnValueOnce({ lastID: 99 });
      db.get.mockResolvedValueOnce({
        id: 99,
        account_id: 11,
        type: "DEBIT",
        amount: 80,
        description: null,
      });

      const result = await TransactionDAO.create({
        accountId: 11,
        type: "DEBIT",
        amount: 80,
      });

      const [, accountId, type, amount, description] = db.run.mock.calls[0];

      expect(accountId).toBe(11);
      expect(type).toBe("DEBIT");
      expect(amount).toBe(80);
      expect(description).toBeNull();

      expect(result).toEqual({
        id: 99,
        account_id: 11,
        type: "DEBIT",
        amount: 80,
        description: null,
      });
    });

    test("propage l'erreur si db.run échoue", async () => {
      const dbError = new Error("Insert DB error");
      db.run.mockImplementationOnce(() => {
        throw dbError;
      });

      expect(() =>
        TransactionDAO.create({
          accountId: 10,
          type: "CREDIT",
          amount: 100,
          description: "Test",
        })
      ).toThrow(dbError);
    });
  });
});