import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/* =====================================================
 * MOCKS
 * ===================================================== */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: { exec: jest.fn() },
}));

jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  __esModule: true,
  AccountDAO: {
    findByIdAndClientId: jest.fn(),
    findCheckingByClientId: jest.fn(),
    updateBalance: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/transaction.model.js", () => ({
  __esModule: true,
  TransactionDAO: { create: jest.fn() },
}));

jest.unstable_mockModule("../../src/models/transfer.model.js", () => ({
  __esModule: true,
  TransferDAO: { create: jest.fn() },
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  __esModule: true,
  UserDAO: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/beneficiary.model.js", () => ({
  __esModule: true,
  BeneficiaryDAO: {
    findByIdAndUserId: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/scheduled-transaction.model.js", () => ({
  __esModule: true,
  ScheduledTransactionDAO: {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findDueActive: jest.fn(),
    markRun: jest.fn(),
    cancel: jest.fn(),
  },
}));

/* =====================================================
 * IMPORTS
 * ===================================================== */
const db = (await import("../../src/config/database.js")).default;
const { TransferService } = await import("../../src/services/transfer.service.js");
const { AccountDAO } = await import("../../src/models/bank.model.js");
const { TransactionDAO } = await import("../../src/models/transaction.model.js");
const { TransferDAO } = await import("../../src/models/transfer.model.js");
const { UserDAO } = await import("../../src/models/user.model.js");
const { BeneficiaryDAO } = await import("../../src/models/beneficiary.model.js");
const { ScheduledTransactionDAO } = await import("../../src/models/scheduled-transaction.model.js");

describe("TransferService – couverture complète", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.exec.mockResolvedValue();
  });

  /* =====================================================
   * createInternalTransfer
   * ===================================================== */
  describe("createInternalTransfer", () => {
    test("400 si montant invalide", async () => {
      const r = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 1,
        toAccountId: 2,
        amount: 0,
      });
      expect(r.status).toBe(400);
    });

    test("404 si compte source introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce(null);

      const r = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 1,
        toAccountId: 2,
        amount: 10,
      });

      expect(r.status).toBe(404);
    });

    test("201 succès avec récurrence weekly", async () => {
      AccountDAO.findByIdAndClientId
        .mockResolvedValueOnce({ id: 1, balance: 100 })
        .mockResolvedValueOnce({ id: 2, balance: 50 });

      AccountDAO.updateBalance.mockResolvedValue();
      TransferDAO.create.mockResolvedValue({ id: 1 });
      TransactionDAO.create.mockResolvedValue({});
      ScheduledTransactionDAO.create.mockResolvedValue({ lastID: 10 });
      ScheduledTransactionDAO.findById.mockResolvedValue({ id: 10 });

      const r = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 1,
        toAccountId: 2,
        amount: 10,
        frequency: "weekly",
      });

      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(db.exec).toHaveBeenNthCalledWith(2, "COMMIT");
      expect(r.status).toBe(201);
      expect(r.data.scheduledTransaction.id).toBe(10);
    });
  });

  /* =====================================================
   * createInteracTransfer
   * ===================================================== */
  describe("createInteracTransfer", () => {
    test("401 si non authentifié", async () => {
      const r = await TransferService.createInteracTransfer({});
      expect(r.status).toBe(401);
    });

    test("400 si email invalide", async () => {
      const r = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 1,
        recipientEmail: "bad",
        amount: 10,
      });
      expect(r.status).toBe(400);
    });

    test("201 interac externe", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue({ id: 1, balance: 100 });
      AccountDAO.updateBalance.mockResolvedValue();
      TransferDAO.create.mockResolvedValue({});
      TransactionDAO.create.mockResolvedValue({});

      const r = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 1,
        recipientEmail: "ext@test.com",
        recipientFirstName: "Jean",
        recipientLastName: "Dupont",
        isExternalRecipient: true,
        amount: 10,
      });

      expect(r.status).toBe(201);
      expect(r.data.recipient.external).toBe(true);
    });

    test("404 destinataire introuvable (interne)", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue({ id: 1, balance: 100 });
      UserDAO.findByEmail.mockResolvedValue(null);

      const r = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 1,
        recipientEmail: "x@test.com",
        amount: 10,
      });

      expect(r.status).toBe(404);
    });
  });

  /* =====================================================
   * payBill
   * ===================================================== */
  describe("payBill", () => {
    test("404 si bénéficiaire introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue({ id: 1, balance: 100 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValue(null);

      const r = await TransferService.payBill({
        userId: 1,
        fromAccountId: 1,
        beneficiaryId: 9,
        amount: 10,
      });

      expect(r.status).toBe(404);
    });

    test("201 succès paiement monthly", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValue({ id: 1, balance: 100 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValue({ id: 5, name: "Hydro" });
      AccountDAO.updateBalance.mockResolvedValue();
      TransactionDAO.create.mockResolvedValue({});
      ScheduledTransactionDAO.create.mockResolvedValue({ lastID: 20 });
      ScheduledTransactionDAO.findById.mockResolvedValue({ id: 20 });

      const r = await TransferService.payBill({
        userId: 1,
        fromAccountId: 1,
        beneficiaryId: 5,
        amount: 10,
        frequency: "monthly",
      });

      expect(r.status).toBe(201);
      expect(r.data.scheduledTransaction.id).toBe(20);
    });
  });

  /* =====================================================
   * processDueScheduledTransactions
   * ===================================================== */
  describe("processDueScheduledTransactions", () => {
    test("aucune transaction à échéance", async () => {
      ScheduledTransactionDAO.findDueActive.mockResolvedValue([]);

      const r = await TransferService.processDueScheduledTransactions();

      expect(r.data).toEqual([]);
    });

    test("internal succès", async () => {
      ScheduledTransactionDAO.findDueActive.mockResolvedValue([
        {
          id: 1,
          kind: "internal",
          user_id: 1,
          from_account_id: 1,
          to_account_id: 2,
          amount: 10,
          frequency: "weekly",
          next_run_date: "2026-01-01 00:00:00",
        },
      ]);

      AccountDAO.findByIdAndClientId
        .mockResolvedValueOnce({ id: 1, balance: 100 })
        .mockResolvedValueOnce({ id: 2, balance: 50 });

      AccountDAO.updateBalance.mockResolvedValue();
      TransferDAO.create.mockResolvedValue();
      TransactionDAO.create.mockResolvedValue();
      ScheduledTransactionDAO.markRun.mockResolvedValue();

      const r = await TransferService.processDueScheduledTransactions();
      expect(r.data[0].ok).toBe(true);
    });

    test("bill solde insuffisant", async () => {
      ScheduledTransactionDAO.findDueActive.mockResolvedValue([
        {
          id: 2,
          kind: "bill",
          user_id: 1,
          from_account_id: 1,
          beneficiary_id: 5,
          amount: 100,
        },
      ]);

      AccountDAO.findByIdAndClientId.mockResolvedValue({ id: 1, balance: 10 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValue({ id: 5 });

      const r = await TransferService.processDueScheduledTransactions();
      expect(r.data[0].error).toBe("Solde insuffisant");
    });
  });

  /* =====================================================
   * getScheduledTransactions
   * ===================================================== */
  describe("getScheduledTransactions", () => {
    test("401 si non authentifié", async () => {
      const r = await TransferService.getScheduledTransactions(null);
      expect(r.status).toBe(401);
    });

    test("200 retourne les transactions", async () => {
      ScheduledTransactionDAO.findByUserId.mockResolvedValue([{ id: 1 }]);

      const r = await TransferService.getScheduledTransactions(1);
      expect(r.status).toBe(200);
      expect(r.data).toEqual([{ id: 1 }]);
    });
  });

  /* =====================================================
   * cancelScheduledTransaction
   * ===================================================== */
  describe("cancelScheduledTransaction", () => {
    test("400 id invalide", async () => {
      const r = await TransferService.cancelScheduledTransaction(1, "abc");
      expect(r.status).toBe(400);
    });

    test("200 déjà annulée", async () => {
      ScheduledTransactionDAO.findById.mockResolvedValue({
        id: 1,
        user_id: 1,
        status: "cancelled",
      });

      const r = await TransferService.cancelScheduledTransaction(1, 1);
      expect(r.status).toBe(200);
    });

    test("200 succès annulation", async () => {
      ScheduledTransactionDAO.findById.mockResolvedValue({
        id: 1,
        user_id: 1,
        status: "active",
      });
      ScheduledTransactionDAO.cancel.mockResolvedValue();

      const r = await TransferService.cancelScheduledTransaction(1, 1);
      expect(r.status).toBe(200);
    });
  });
});
