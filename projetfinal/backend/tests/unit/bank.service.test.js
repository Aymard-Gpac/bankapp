import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/* =====================================================
 * MOCKS
 * ===================================================== */
jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  __esModule: true,
  AccountDAO: {
    findByClientId: jest.fn(),
    summaryByClientId: jest.fn(),
    findByIdAndClientId: jest.fn(),
    findAnyByIdAndClientId: jest.fn(),
    closeAccount: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/transaction.model.js", () => ({
  __esModule: true,
  TransactionDAO: {
    findByAccountIdPaginated: jest.fn(),
    countByAccountId: jest.fn(),
    findHistoryByClientId: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/scheduled-transaction.model.js", () => ({
  __esModule: true,
  ScheduledTransactionDAO: {
    countActiveByAccountId: jest.fn(),
  },
}));

/* =====================================================
 * IMPORTS
 * ===================================================== */
const { BankService } = await import("../../src/services/bank.service.js");
const { AccountDAO } = await import("../../src/models/bank.model.js");
const { TransactionDAO } = await import("../../src/models/transaction.model.js");
const { ScheduledTransactionDAO } = await import(
  "../../src/models/scheduled-transaction.model.js"
);

describe("BankService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * getClientAccounts
   * ===================================================== */
  describe("getClientAccounts", () => {
    test("retourne comptes + résumé", async () => {
      AccountDAO.findByClientId.mockResolvedValue([{ id: 1 }]);
      AccountDAO.summaryByClientId.mockResolvedValue({
        totalBanks: 1,
        totalCurrentBalance: 1000,
      });

      const res = await BankService.getClientAccounts(1);

      expect(res).toEqual({
        data: [{ id: 1 }],
        totalBanks: 1,
        totalCurrentBalance: 1000,
      });
    });

    test("propage erreur DAO", async () => {
      AccountDAO.findByClientId.mockRejectedValue(new Error("DB error"));
      await expect(BankService.getClientAccounts(1)).rejects.toThrow();
    });
  });

  /* =====================================================
   * getClientAccount
   * ===================================================== */
  describe("getClientAccount", () => {
    test("404 si compte introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(null);

      await expect(
        BankService.getClientAccount({ clientId: 1, accountId: 99 })
      ).rejects.toMatchObject({ status: 404 });
    });

    test("succès avec pagination", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue({ id: 1 });
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue([{ id: 10 }]);
      TransactionDAO.countByAccountId.mockResolvedValue({ total: 1 });

      const res = await BankService.getClientAccount({
        clientId: 1,
        accountId: 1,
        page: 1,
        pageSize: 10,
      });

      expect(res.pagination.totalPages).toBe(1);
    });
  });

  /* =====================================================
   * getClientTransactionHistory
   * ===================================================== */
  describe("getClientTransactionHistory", () => {
    test("retourne historique", async () => {
      TransactionDAO.findHistoryByClientId.mockResolvedValue([{ id: 1 }]);

      const res = await BankService.getClientTransactionHistory(1);

      expect(res).toEqual([{ id: 1 }]);
    });

    test("propage erreur DAO", async () => {
      TransactionDAO.findHistoryByClientId.mockRejectedValue(
        new Error("History error")
      );

      await expect(
        BankService.getClientTransactionHistory(1)
      ).rejects.toThrow();
    });
  });

  /* =====================================================
   * closeClientAccount (CRITIQUE)
   * ===================================================== */
  describe("closeClientAccount", () => {
    test("404 si compte introuvable", async () => {
      AccountDAO.findAnyByIdAndClientId.mockResolvedValue(null);

      await expect(
        BankService.closeClientAccount({ clientId: 1, accountId: 10 })
      ).rejects.toMatchObject({ status: 404 });
    });

    test("409 si compte déjà fermé", async () => {
      AccountDAO.findAnyByIdAndClientId.mockResolvedValue({
        status: "closed",
      });

      await expect(
        BankService.closeClientAccount({ clientId: 1, accountId: 10 })
      ).rejects.toMatchObject({ status: 409 });
    });

    test("409 si solde non nul", async () => {
      AccountDAO.findAnyByIdAndClientId.mockResolvedValue({
        status: "active",
        balance: 50,
      });

      await expect(
        BankService.closeClientAccount({ clientId: 1, accountId: 10 })
      ).rejects.toMatchObject({ status: 409 });
    });

    test("409 si transactions programmées actives", async () => {
      AccountDAO.findAnyByIdAndClientId.mockResolvedValue({
        status: "active",
        balance: 0,
      });

      ScheduledTransactionDAO.countActiveByAccountId.mockResolvedValue({
        total: 2,
      });

      await expect(
        BankService.closeClientAccount({ clientId: 1, accountId: 10 })
      ).rejects.toMatchObject({ status: 409 });
    });

    test("500 si fermeture échoue", async () => {
      AccountDAO.findAnyByIdAndClientId.mockResolvedValue({
        status: "active",
        balance: 0,
      });

      ScheduledTransactionDAO.countActiveByAccountId.mockResolvedValue({
        total: 0,
      });

      AccountDAO.closeAccount.mockResolvedValue({ changes: 0 });

      await expect(
        BankService.closeClientAccount({ clientId: 1, accountId: 10 })
      ).rejects.toMatchObject({ status: 500 });
    });

    test("succès fermeture du compte", async () => {
      AccountDAO.findAnyByIdAndClientId.mockResolvedValue({
        status: "active",
        balance: 0,
      });

      ScheduledTransactionDAO.countActiveByAccountId.mockResolvedValue({
        total: 0,
      });

      AccountDAO.closeAccount.mockResolvedValue({ changes: 1 });

      const res = await BankService.closeClientAccount({
        clientId: 1,
        accountId: 10,
      });

      expect(res).toEqual({
        message: "Compte bancaire fermé avec succès",
        data: {
          accountId: 10,
          status: "closed",
        },
      });
    });
  });
});
