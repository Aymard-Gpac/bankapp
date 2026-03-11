import { jest, describe, test, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../../src/services/bank.service.js", () => ({
  BankService: {
    getClientAccounts: jest.fn(),
    getClientAccount: jest.fn(),
    getClientTransactionHistory: jest.fn(),
  },
}));

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

  describe("getClientAccounts", () => {
    test("retourne 400 si clientId est invalide", async () => {
      req.params.clientId = "abc";

      await BankController.getClientAccounts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid clientId" });
      expect(BankService.getClientAccounts).not.toHaveBeenCalled();
    });

    test("retourne 403 si un client essaie d'accéder aux comptes d'un autre client", async () => {
      req.params.clientId = "999";
      req.user = { id: 123, role: "client" };

      await BankController.getClientAccounts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
      expect(BankService.getClientAccounts).not.toHaveBeenCalled();
    });

    test("retourne les comptes si tout est correct", async () => {
      const mockResult = {
        data: [{ id: 1, type: "cheque" }],
        totalBanks: 1,
        totalCurrentBalance: 1000,
      };

      BankService.getClientAccounts.mockResolvedValue(mockResult);

      await BankController.getClientAccounts(req, res, next);

      expect(BankService.getClientAccounts).toHaveBeenCalledWith(123);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    test("autorise un etudiant à consulter les comptes d'un client", async () => {
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

    test("appelle next(err) si le service lance une erreur", async () => {
      const err = new Error("Service accounts error");
      BankService.getClientAccounts.mockRejectedValue(err);

      await BankController.getClientAccounts(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getClientTransactionHistory", () => {
    test("retourne 400 si clientId est invalide", async () => {
      req.params.clientId = "abc";

      await BankController.getClientTransactionHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid clientId" });
      expect(BankService.getClientTransactionHistory).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test("retourne 403 si un client essaie d'accéder à l'historique d'un autre client", async () => {
      req.params.clientId = "999";
      req.user = { id: 123, role: "client" };

      await BankController.getClientTransactionHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
      expect(BankService.getClientTransactionHistory).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test("retourne les données d'historique si tout est correct", async () => {
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
      ];

      BankService.getClientTransactionHistory.mockResolvedValue(mockHistory);

      await BankController.getClientTransactionHistory(req, res, next);

      expect(BankService.getClientTransactionHistory).toHaveBeenCalledTimes(1);
      expect(BankService.getClientTransactionHistory).toHaveBeenCalledWith(123);
      expect(res.json).toHaveBeenCalledWith({ data: mockHistory });
      expect(next).not.toHaveBeenCalled();
    });

    test("appelle next(err) si le service lance une erreur", async () => {
      const serviceError = new Error("Service history error");
      BankService.getClientTransactionHistory.mockRejectedValue(serviceError);

      await BankController.getClientTransactionHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(serviceError);
    });

    test("autorise un etudiant à consulter l'historique d'un client", async () => {
      req.user = { id: 50, role: "etudiant" };
      BankService.getClientTransactionHistory.mockResolvedValue([]);

      await BankController.getClientTransactionHistory(req, res, next);

      expect(BankService.getClientTransactionHistory).toHaveBeenCalledWith(123);
      expect(res.json).toHaveBeenCalledWith({ data: [] });
    });
  });

  describe("getClientAccount", () => {
    test("retourne 400 si clientId est invalide", async () => {
      req.params.clientId = "abc";

      await BankController.getClientAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid parameters" });
      expect(BankService.getClientAccount).not.toHaveBeenCalled();
    });

    test("retourne 400 si accountId est invalide", async () => {
      req.params.accountId = "abc";

      await BankController.getClientAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid parameters" });
      expect(BankService.getClientAccount).not.toHaveBeenCalled();
    });

    test("retourne 403 si un client essaie d'accéder au compte d'un autre client", async () => {
      req.params.clientId = "999";
      req.user = { id: 123, role: "client" };

      await BankController.getClientAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
      expect(BankService.getClientAccount).not.toHaveBeenCalled();
    });

    test("retourne les données du compte avec pagination par défaut", async () => {
      const mockResult = {
        account: { id: 456, type: "cheque" },
        transactions: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      };

      BankService.getClientAccount.mockResolvedValue(mockResult);

      await BankController.getClientAccount(req, res, next);

      expect(BankService.getClientAccount).toHaveBeenCalledTimes(1);

      const calledArgs = BankService.getClientAccount.mock.calls[0][0];

      expect(calledArgs).toMatchObject({
        clientId: 123,
        accountId: 456,
      });

      expect(calledArgs.page ?? 1).toBe(1);
      expect(calledArgs.pageSize ?? 10).toBe(10);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test("retourne les données du compte avec pagination personnalisée", async () => {
      req.query = { page: "2", pageSize: "5" };

      const mockResult = {
        account: { id: 456, type: "cheque" },
        transactions: [{ id: 1 }],
        pagination: {
          page: 2,
          pageSize: 5,
          total: 12,
          totalPages: 3,
        },
      };

      BankService.getClientAccount.mockResolvedValue(mockResult);

      await BankController.getClientAccount(req, res, next);

      expect(BankService.getClientAccount).toHaveBeenCalledTimes(1);

      const calledArgs = BankService.getClientAccount.mock.calls[0][0];

      expect(calledArgs).toMatchObject({
        clientId: 123,
        accountId: 456,
      });

      expect(calledArgs.page ?? 2).toBe(2);
      expect(calledArgs.pageSize ?? 5).toBe(5);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test("autorise un etudiant à consulter le compte d'un client", async () => {
      req.user = { id: 50, role: "etudiant" };
      BankService.getClientAccount.mockResolvedValue({
        account: { id: 456 },
        transactions: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      });

      await BankController.getClientAccount(req, res, next);

      expect(BankService.getClientAccount).toHaveBeenCalledTimes(1);

      const calledArgs = BankService.getClientAccount.mock.calls[0][0];

      expect(calledArgs).toMatchObject({
        clientId: 123,
        accountId: 456,
      });

      expect(res.json).toHaveBeenCalledWith({
        account: { id: 456 },
        transactions: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      });
    });

    test("appelle next(err) si le service lance une erreur", async () => {
      const err = new Error("Service account error");
      BankService.getClientAccount.mockRejectedValue(err);

      await BankController.getClientAccount(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});