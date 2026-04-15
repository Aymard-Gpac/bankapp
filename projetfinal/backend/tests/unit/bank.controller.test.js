import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/* =====================================================
 * Mock du service
 * ===================================================== */
jest.unstable_mockModule("../../src/services/bank.service.js", () => ({
  __esModule: true,
  BankService: {
    getClientAccounts: jest.fn(),
    getClientAccount: jest.fn(),
    getClientTransactionHistory: jest.fn(),
    closeClientAccount: jest.fn(),
  },
}));

/* =====================================================
 * Imports
 * ===================================================== */
const { BankController } = await import("../../src/controllers/bank.controller.js");
const { BankService } = await import("../../src/services/bank.service.js");

describe("BankController", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { clientId: "123", accountId: "456" },
      query: {},
      user: { id: 123, role: "client" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  /* =====================================================
   * getClientAccounts
   * ===================================================== */
  describe("getClientAccounts", () => {
    test("400 si clientId invalide", async () => {
      req.params.clientId = "abc";

      await BankController.getClientAccounts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid clientId" });
      expect(BankService.getClientAccounts).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test("403 si client accède aux comptes d’un autre client", async () => {
      req.params.clientId = "999";

      await BankController.getClientAccounts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
      expect(BankService.getClientAccounts).not.toHaveBeenCalled();
    });

    test("succès – client autorisé", async () => {
      const result = {
        data: [{ id: 1 }],
        totalBanks: 1,
        totalCurrentBalance: 1000,
      };

      BankService.getClientAccounts.mockResolvedValue(result);

      await BankController.getClientAccounts(req, res, next);

      expect(BankService.getClientAccounts).toHaveBeenCalledWith(123);
      expect(res.json).toHaveBeenCalledWith(result);
      expect(next).not.toHaveBeenCalled();
    });

    test("succès – étudiant autorisé", async () => {
      req.user = { id: 50, role: "etudiant" };

      BankService.getClientAccounts.mockResolvedValue({
        data: [],
        totalBanks: 0,
        totalCurrentBalance: 0,
      });

      await BankController.getClientAccounts(req, res, next);

      expect(BankService.getClientAccounts).toHaveBeenCalledWith(123);
      expect(res.json).toHaveBeenCalledWith({
        data: [],
        totalBanks: 0,
        totalCurrentBalance: 0,
      });
    });

    test("next(err) si le service échoue", async () => {
      const err = new Error("Service error");
      BankService.getClientAccounts.mockRejectedValue(err);

      await BankController.getClientAccounts(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  /* =====================================================
   * getClientAccount
   * ===================================================== */
  describe("getClientAccount", () => {
    test("400 si paramètres invalides", async () => {
      req.params.accountId = "abc";

      await BankController.getClientAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid parameters" });
      expect(BankService.getClientAccount).not.toHaveBeenCalled();
    });

    test("403 si client interdit", async () => {
      req.params.clientId = "999";

      await BankController.getClientAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
    });

    test("succès avec pagination par défaut", async () => {
      const result = {
        account: { id: 456 },
        transactions: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      };

      BankService.getClientAccount.mockResolvedValue(result);

      await BankController.getClientAccount(req, res, next);

      expect(BankService.getClientAccount).toHaveBeenCalledWith({
        clientId: 123,
        accountId: 456,
        page: 1,
      });

      expect(res.json).toHaveBeenCalledWith(result);
    });

    test("succès avec pagination personnalisée", async () => {
      req.query.page = "2";

      const result = {
        account: { id: 456 },
        transactions: [{ id: 1 }],
        pagination: { page: 2, pageSize: 10, total: 20, totalPages: 2 },
      };

      BankService.getClientAccount.mockResolvedValue(result);

      await BankController.getClientAccount(req, res, next);

      expect(BankService.getClientAccount).toHaveBeenCalledWith({
        clientId: 123,
        accountId: 456,
        page: 2,
      });

      expect(res.json).toHaveBeenCalledWith(result);
    });

    test("next(err) si le service échoue", async () => {
      const err = new Error("Service account error");
      BankService.getClientAccount.mockRejectedValue(err);

      await BankController.getClientAccount(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  /* =====================================================
   * getClientTransactionHistory
   * ===================================================== */
  describe("getClientTransactionHistory", () => {
    test("400 si clientId invalide", async () => {
      req.params.clientId = "abc";

      await BankController.getClientTransactionHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid clientId" });
      expect(next).not.toHaveBeenCalled();
    });

    test("403 si client interdit", async () => {
      req.params.clientId = "999";

      await BankController.getClientTransactionHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
    });

    test("succès", async () => {
      const history = [{ id: 1 }];
      BankService.getClientTransactionHistory.mockResolvedValue(history);

      await BankController.getClientTransactionHistory(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: history });
    });

    test("next(err) si service échoue", async () => {
      const err = new Error("History error");
      BankService.getClientTransactionHistory.mockRejectedValue(err);

      await BankController.getClientTransactionHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  /* =====================================================
   * closeClientAccount
   * ===================================================== */
  describe("closeClientAccount", () => {
    test("400 si paramètres invalides", async () => {
      req.params.accountId = "abc";

      await BankController.closeClientAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid parameters" });
    });

    test("200 succès fermeture", async () => {
      const result = {
        message: "Compte bancaire fermé avec succès",
        data: { accountId: 456, status: "closed" },
      };

      BankService.closeClientAccount.mockResolvedValue(result);

      await BankController.closeClientAccount(req, res, next);

      expect(BankService.closeClientAccount).toHaveBeenCalledWith({
        clientId: 123,
        accountId: 456,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    test("next(err) si erreur service", async () => {
      const err = new Error("Close error");
      BankService.closeClientAccount.mockRejectedValue(err);

      await BankController.closeClientAccount(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});