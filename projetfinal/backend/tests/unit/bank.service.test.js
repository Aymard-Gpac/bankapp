import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// Mock des dépendances
jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  AccountDAO: {
    findByClientId: jest.fn(),
    summaryByClientId: jest.fn(),
    findByIdAndClientId: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/transaction.model.js", () => ({
  TransactionDAO: {
    findByAccountIdPaginated: jest.fn(),
    countByAccountId: jest.fn(),
    findHistoryByClientId: jest.fn(), // AJOUT
  },
}));

// Import après les mocks
const { BankService } = await import("../../src/services/bank.service.js");
const { AccountDAO } = await import("../../src/models/bank.model.js");
const { TransactionDAO } = await import("../../src/models/transaction.model.js");

describe("BankService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getClientAccounts", () => {
    const mockClientId = 123;

    const mockAccounts = [
      { id: 1, client_id: 123, type: "cheque", balance: 1000, currency: "CAD" },
      { id: 2, client_id: 123, type: "epargne", balance: 5000, currency: "CAD" },
      { id: 3, client_id: 123, type: "credit", balance: -500, currency: "CAD" },
    ];

    const mockSummary = {
      totalBanks: 3,
      totalCurrentBalance: 5500,
    };

    test("devrait retourner les comptes et le résumé pour un client", async () => {
      AccountDAO.findByClientId.mockResolvedValue(mockAccounts);
      AccountDAO.summaryByClientId.mockResolvedValue(mockSummary);

      const result = await BankService.getClientAccounts(mockClientId);

      expect(AccountDAO.findByClientId).toHaveBeenCalledWith(mockClientId);
      expect(AccountDAO.summaryByClientId).toHaveBeenCalledWith(mockClientId);

      expect(result).toEqual({
        data: mockAccounts,
        totalBanks: mockSummary.totalBanks,
        totalCurrentBalance: mockSummary.totalCurrentBalance,
      });
    });

    test("devrait retourner une liste vide si le client n'a pas de comptes", async () => {
      AccountDAO.findByClientId.mockResolvedValue([]);
      AccountDAO.summaryByClientId.mockResolvedValue({
        totalBanks: 0,
        totalCurrentBalance: 0,
      });

      const result = await BankService.getClientAccounts(999);

      expect(result).toEqual({
        data: [],
        totalBanks: 0,
        totalCurrentBalance: 0,
      });
    });

    test("devrait propager les erreurs de AccountDAO.findByClientId", async () => {
      const dbError = new Error("Database error");
      AccountDAO.findByClientId.mockRejectedValue(dbError);

      await expect(BankService.getClientAccounts(mockClientId)).rejects.toThrow(
        dbError
      );
    });

    test("devrait propager les erreurs de AccountDAO.summaryByClientId", async () => {
      AccountDAO.findByClientId.mockResolvedValue(mockAccounts);

      const dbError = new Error("Summary error");
      AccountDAO.summaryByClientId.mockRejectedValue(dbError);

      await expect(BankService.getClientAccounts(mockClientId)).rejects.toThrow(
        dbError
      );
    });

    test("devrait gérer différents types de comptes", async () => {
      const mixedAccounts = [
        { id: 1, type: "cheque", balance: 100 },
        { id: 2, type: "epargne", balance: 200 },
        { id: 3, type: "credit", balance: -300 },
        { id: 4, type: "marge", balance: 400 },
      ];

      AccountDAO.findByClientId.mockResolvedValue(mixedAccounts);
      AccountDAO.summaryByClientId.mockResolvedValue({
        totalBanks: 4,
        totalCurrentBalance: 400,
      });

      const result = await BankService.getClientAccounts(mockClientId);

      expect(result.data).toHaveLength(4);
      expect(result.totalBanks).toBe(4);
    });
  });

  describe("getClientAccount", () => {
    const mockClientId = 123;
    const mockAccountId = 456;
    const mockPage = 2;
    const mockPageSize = 5;

    const mockAccount = {
      id: 456,
      client_id: 123,
      type: "cheque",
      balance: 1500,
      currency: "CAD",
      account_number: "CHEQUE-123456-789",
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockTransactions = [
      { id: 1, amount: 100, type: "deposit", date: "2024-01-15" },
      { id: 2, amount: -50, type: "withdrawal", date: "2024-01-16" },
      { id: 3, amount: 200, type: "deposit", date: "2024-01-17" },
      { id: 4, amount: -75, type: "withdrawal", date: "2024-01-18" },
      { id: 5, amount: 300, type: "deposit", date: "2024-01-19" },
    ];

    const mockTotalRow = { total: 15 };

    test("devrait retourner un compte avec ses transactions et pagination", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue(mockTransactions);
      TransactionDAO.countByAccountId.mockResolvedValue(mockTotalRow);

      const result = await BankService.getClientAccount({
        clientId: mockClientId,
        accountId: mockAccountId,
        page: mockPage,
        pageSize: mockPageSize,
      });

      expect(AccountDAO.findByIdAndClientId).toHaveBeenCalledWith(
        mockAccountId,
        mockClientId
      );

      expect(TransactionDAO.findByAccountIdPaginated).toHaveBeenCalledWith(
        mockAccountId,
        mockPageSize,
        (mockPage - 1) * mockPageSize
      );

      expect(TransactionDAO.countByAccountId).toHaveBeenCalledWith(mockAccountId);

      expect(result).toEqual({
        account: mockAccount,
        transactions: mockTransactions,
        pagination: {
          page: mockPage,
          pageSize: mockPageSize,
          total: mockTotalRow.total,
          totalPages: Math.ceil(mockTotalRow.total / mockPageSize),
        },
      });
    });

    test("devrait utiliser les valeurs par défaut pour page et pageSize", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue([]);
      TransactionDAO.countByAccountId.mockResolvedValue({ total: 0 });

      await BankService.getClientAccount({
        clientId: mockClientId,
        accountId: mockAccountId,
      });

      expect(TransactionDAO.findByAccountIdPaginated).toHaveBeenCalledWith(
        mockAccountId,
        10,
        0
      );
    });

    test("devrait lancer une erreur 404 si le compte n'existe pas", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(null);

      await expect(
        BankService.getClientAccount({
          clientId: mockClientId,
          accountId: 999,
        })
      ).rejects.toMatchObject({
        message: "Account not found for this client",
        status: 404,
      });

      expect(TransactionDAO.findByAccountIdPaginated).not.toHaveBeenCalled();
      expect(TransactionDAO.countByAccountId).not.toHaveBeenCalled();
    });

    test("devrait lancer une erreur 404 si le compte appartient à un autre client", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(null);

      await expect(
        BankService.getClientAccount({
          clientId: 999,
          accountId: mockAccountId,
        })
      ).rejects.toMatchObject({
        message: "Account not found for this client",
        status: 404,
      });
    });

    test("devrait gérer une page avec peu de transactions", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);

      const fewTransactions = mockTransactions.slice(0, 2);
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue(fewTransactions);
      TransactionDAO.countByAccountId.mockResolvedValue({ total: 2 });

      const result = await BankService.getClientAccount({
        clientId: mockClientId,
        accountId: mockAccountId,
        page: 1,
        pageSize: 10,
      });

      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      });
    });

    test("devrait gérer une page sans transactions", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);

      TransactionDAO.findByAccountIdPaginated.mockResolvedValue([]);
      TransactionDAO.countByAccountId.mockResolvedValue({ total: 0 });

      const result = await BankService.getClientAccount({
        clientId: mockClientId,
        accountId: mockAccountId,
        page: 5,
        pageSize: 10,
      });

      expect(result.transactions).toEqual([]);
      expect(result.pagination).toEqual({
        page: 5,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      });
    });

    test("devrait calculer correctement l'offset pour différentes pages", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);
      TransactionDAO.countByAccountId.mockResolvedValue({ total: 30 });
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue([]);

      await BankService.getClientAccount({
        clientId: mockClientId,
        accountId: mockAccountId,
        page: 2,
        pageSize: 10,
      });

      expect(TransactionDAO.findByAccountIdPaginated).toHaveBeenCalledWith(
        mockAccountId,
        10,
        10
      );

      await BankService.getClientAccount({
        clientId: mockClientId,
        accountId: mockAccountId,
        page: 3,
        pageSize: 15,
      });

      expect(TransactionDAO.findByAccountIdPaginated).toHaveBeenCalledWith(
        mockAccountId,
        15,
        30
      );
    });

    test("devrait propager les erreurs de AccountDAO.findByIdAndClientId", async () => {
      const dbError = new Error("Database error");
      AccountDAO.findByIdAndClientId.mockRejectedValue(dbError);

      await expect(
        BankService.getClientAccount({
          clientId: mockClientId,
          accountId: mockAccountId,
        })
      ).rejects.toThrow(dbError);
    });

    test("devrait propager les erreurs de TransactionDAO.findByAccountIdPaginated", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);

      const dbError = new Error("Transaction error");
      TransactionDAO.findByAccountIdPaginated.mockRejectedValue(dbError);

      await expect(
        BankService.getClientAccount({
          clientId: mockClientId,
          accountId: mockAccountId,
        })
      ).rejects.toThrow(dbError);
    });

    test("devrait propager les erreurs de TransactionDAO.countByAccountId", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue([]);

      const dbError = new Error("Count error");
      TransactionDAO.countByAccountId.mockRejectedValue(dbError);

      await expect(
        BankService.getClientAccount({
          clientId: mockClientId,
          accountId: mockAccountId,
        })
      ).rejects.toThrow(dbError);
    });
  });

  describe("getClientTransactionHistory", () => {
    const mockClientId = 123;

    const mockHistory = [
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
      {
        id: 2,
        account_id: 11,
        account_type: "epargne",
        account_number: "EPARGNE-123",
        description: "Transfert vers épargne",
        amount: 300,
        type: "DEBIT",
        created_at: "2026-03-11T12:00:00Z",
      },
    ];

    test("devrait retourner l'historique complet des transactions d'un client", async () => {
      TransactionDAO.findHistoryByClientId.mockResolvedValue(mockHistory);

      const result = await BankService.getClientTransactionHistory(mockClientId);

      expect(TransactionDAO.findHistoryByClientId).toHaveBeenCalledTimes(1);
      expect(TransactionDAO.findHistoryByClientId).toHaveBeenCalledWith(mockClientId);
      expect(result).toEqual(mockHistory);
    });

    test("devrait retourner un tableau vide si le client n'a aucune transaction", async () => {
      TransactionDAO.findHistoryByClientId.mockResolvedValue([]);

      const result = await BankService.getClientTransactionHistory(mockClientId);

      expect(TransactionDAO.findHistoryByClientId).toHaveBeenCalledWith(mockClientId);
      expect(result).toEqual([]);
    });

    test("devrait propager l'erreur si TransactionDAO.findHistoryByClientId échoue", async () => {
      const dbError = new Error("History DB error");
      TransactionDAO.findHistoryByClientId.mockRejectedValue(dbError);

      await expect(
        BankService.getClientTransactionHistory(mockClientId)
      ).rejects.toThrow(dbError);
    });
  });

  describe("Cas d'utilisation avancés", () => {
    test("devrait gérer un client avec plusieurs comptes de différents types", async () => {
      const clientId = 456;
      const accounts = [
        { id: 10, type: "cheque", balance: 1000 },
        { id: 11, type: "epargne", balance: 10000 },
        { id: 12, type: "credit", balance: -2000 },
      ];

      AccountDAO.findByClientId.mockResolvedValue(accounts);
      AccountDAO.summaryByClientId.mockResolvedValue({
        totalBanks: 3,
        totalCurrentBalance: 9000,
      });

      const result = await BankService.getClientAccounts(clientId);

      expect(result.totalBanks).toBe(3);
      expect(result.totalCurrentBalance).toBe(9000);
    });

    test("devrait récupérer les transactions d'un compte avec pagination correcte", async () => {
      const accountId = 789;
      const clientId = 123;

      AccountDAO.findByIdAndClientId.mockResolvedValue({
        id: accountId,
        client_id: clientId,
      });

      TransactionDAO.countByAccountId.mockResolvedValue({ total: 25 });

      const mockTransactionsPage = Array(10).fill({ id: 1, amount: 100 });
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue(mockTransactionsPage);

      const result = await BankService.getClientAccount({
        clientId,
        accountId,
        page: 2,
        pageSize: 10,
      });

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
      });

      expect(result.transactions).toHaveLength(10);
    });
  });
});