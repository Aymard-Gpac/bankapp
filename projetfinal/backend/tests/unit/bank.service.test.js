// tests/unit/bank.service.test.js
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
      // Mock des appels DAO
      AccountDAO.findByClientId.mockResolvedValue(mockAccounts);
      AccountDAO.summaryByClientId.mockResolvedValue(mockSummary);

      // Exécution
      const result = await BankService.getClientAccounts(mockClientId);

      // Vérifications
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

      await expect(BankService.getClientAccounts(mockClientId)).rejects.toThrow(dbError);
    });

    test("devrait propager les erreurs de AccountDAO.summaryByClientId", async () => {
      AccountDAO.findByClientId.mockResolvedValue(mockAccounts);
      
      const dbError = new Error("Summary error");
      AccountDAO.summaryByClientId.mockRejectedValue(dbError);

      await expect(BankService.getClientAccounts(mockClientId)).rejects.toThrow(dbError);
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

    const mockTotalRow = { total: 15 }; // 15 transactions au total

    test("devrait retourner un compte avec ses transactions et pagination", async () => {
      // Mock des appels DAO
      AccountDAO.findByIdAndClientId.mockResolvedValue(mockAccount);
      TransactionDAO.findByAccountIdPaginated.mockResolvedValue(mockTransactions);
      TransactionDAO.countByAccountId.mockResolvedValue(mockTotalRow);

      // Exécution
      const result = await BankService.getClientAccount({
        clientId: mockClientId,
        accountId: mockAccountId,
        page: mockPage,
        pageSize: mockPageSize,
      });

      // Vérifications
      expect(AccountDAO.findByIdAndClientId).toHaveBeenCalledWith(
        mockAccountId,
        mockClientId
      );

      expect(TransactionDAO.findByAccountIdPaginated).toHaveBeenCalledWith(
        mockAccountId,
        mockPageSize,
        (mockPage - 1) * mockPageSize // offset = 5
      );

      expect(TransactionDAO.countByAccountId).toHaveBeenCalledWith(mockAccountId);

      // Vérification de la structure de retour
      expect(result).toEqual({
        account: mockAccount,
        transactions: mockTransactions,
        pagination: {
          page: mockPage,
          pageSize: mockPageSize,
          total: mockTotalRow.total,
          totalPages: Math.ceil(mockTotalRow.total / mockPageSize), // 15/5 = 3
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
        // pas de page et pageSize fournis
      });

      expect(TransactionDAO.findByAccountIdPaginated).toHaveBeenCalledWith(
        mockAccountId,
        10, // pageSize par défaut
        0   // offset = (1-1)*10
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
      // Compte trouvé mais avec un client_id différent
      AccountDAO.findByIdAndClientId.mockResolvedValue(null); // La méthode devrait retourner null si le client_id ne correspond pas

      await expect(
        BankService.getClientAccount({
          clientId: 999, // Mauvais client
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
        totalPages: 1, // 2/10 = 0.2 → ceil = 1
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

      // Page 2 avec pageSize 10 → offset = 10
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

      // Page 3 avec pageSize 15 → offset = 30
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
        totalCurrentBalance: 9000, // 1000 + 10000 - 2000
      });

      const result = await BankService.getClientAccounts(clientId);

      expect(result.totalBanks).toBe(3);
      expect(result.totalCurrentBalance).toBe(9000);
    });

    test("devrait récupérer les transactions d'un compte avec pagination correcte", async () => {
      const accountId = 789;
      const clientId = 123;
      
      AccountDAO.findByIdAndClientId.mockResolvedValue({ id: accountId, client_id: clientId });
      
      // Simuler 25 transactions totales
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
        totalPages: 3, // 25/10 = 2.5 → ceil = 3
      });
      
      expect(result.transactions).toHaveLength(10);
    });
  });
});