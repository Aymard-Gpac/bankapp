import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * ✅ On mock la DB (ici seulement db.exec)
 * Objectif: vérifier que le service fait bien BEGIN / COMMIT / ROLLBACK
 * sans toucher à la vraie base SQLite.
 */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    exec: jest.fn(),
  },
}));

/**
 * ✅ On mock les DAO pour isoler la logique métier du service.
 * Les DAO = accès base de données.
 * Le service = règles (validation, solde, transactions, rollback, etc.)
 */
jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  AccountDAO: {
    findByIdAndClientId: jest.fn(),      // compte d'un client (ownership)
    findCheckingByClientId: jest.fn(),   // compte courant du destinataire (Interac)
    updateBalance: jest.fn(),            // mise à jour solde
  },
}));

jest.unstable_mockModule("../../src/models/transaction.model.js", () => ({
  TransactionDAO: {
    create: jest.fn(), // création d'une transaction (débit/crédit)
  },
}));

jest.unstable_mockModule("../../src/models/transfer.model.js", () => ({
  TransferDAO: {
    create: jest.fn(), // création d'un virement (trace)
  },
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  UserDAO: {
    findById: jest.fn(), // récupère infos du destinataire (Interac)
  },
}));

jest.unstable_mockModule("../../src/models/beneficiary.model.js", () => ({
  BeneficiaryDAO: {
    findByIdAndUserId: jest.fn(), // bénéficiaire d'une facture
  },
}));

// ✅ Imports réels après mocks (important en ESM)
const db = (await import("../../src/config/database.js")).default;
const { TransferService } = await import("../../src/services/transfer.service.js");
const { AccountDAO } = await import("../../src/models/bank.model.js");
const { TransactionDAO } = await import("../../src/models/transaction.model.js");
const { TransferDAO } = await import("../../src/models/transfer.model.js");
const { UserDAO } = await import("../../src/models/user.model.js");
const { BeneficiaryDAO } = await import("../../src/models/beneficiary.model.js");

describe("TransferService", () => {
  beforeEach(() => {
    // ✅ Reset des mocks entre tests (évite les interférences)
    jest.clearAllMocks();

    // ✅ Par défaut, db.exec ne plante pas (BEGIN/COMMIT/ROLLBACK réussissent)
    db.exec.mockResolvedValue(undefined);
  });

  // =========================
  // createInternalTransfer
  // =========================
  describe("createInternalTransfer", () => {
    test("400 si montant invalide", async () => {
      // ✅ On teste la validation la plus simple
      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 10,
        toAccountId: 20,
        amount: 0,
      });

      // ✅ Le service refuse immédiatement, donc aucune transaction SQL
      expect(res).toEqual({ ok: false, status: 400, error: "Montant invalide" });
      expect(db.exec).not.toHaveBeenCalled();
    });

    test("400 si comptes manquants", async () => {
      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: null,
        toAccountId: 20,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Comptes manquants" });
      expect(db.exec).not.toHaveBeenCalled();
    });

    test("400 si comptes identiques", async () => {
      // ✅ Cas métier : pas de virement vers le même compte
      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 10,
        toAccountId: 10,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Comptes identiques" });
      expect(db.exec).not.toHaveBeenCalled();
    });

    test("404 si compte source introuvable", async () => {
      // ✅ On simule la DB: compte source absent
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce(null);
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 20, balance: 0 });

      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 10,
        toAccountId: 20,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 404, error: "Compte source introuvable" });
      expect(db.exec).not.toHaveBeenCalled();
    });

    test("404 si compte destination introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce(null);

      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 10,
        toAccountId: 20,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 404, error: "Compte destination introuvable" });
      expect(db.exec).not.toHaveBeenCalled();
    });

    test("400 si solde insuffisant", async () => {
      // ✅ from.balance trop bas => rejet sans BEGIN
      AccountDAO.findByIdAndClientId
        .mockResolvedValueOnce({ id: 10, balance: 5 })
        .mockResolvedValueOnce({ id: 20, balance: 0 });

      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 10,
        toAccountId: 20,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Solde insuffisant" });
      expect(db.exec).not.toHaveBeenCalled();
    });

    test("201 succès: BEGIN -> update balances -> create transfer + 2 transactions -> COMMIT", async () => {
      // ✅ Cas nominal (succès)
      AccountDAO.findByIdAndClientId
        .mockResolvedValueOnce({ id: 10, balance: 200 })
        .mockResolvedValueOnce({ id: 20, balance: 50 });

      // ✅ Les écritures DB réussissent
      AccountDAO.updateBalance.mockResolvedValue({ changes: 1 });
      TransferDAO.create.mockResolvedValue({ id: 999 });
      TransactionDAO.create
        .mockResolvedValueOnce({ id: 1 }) // débit
        .mockResolvedValueOnce({ id: 2 }); // crédit

      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 10,
        toAccountId: 20,
        amount: 10,
        frequency: "monthly",
        description: "test",
      });

      // ✅ On vérifie la transaction atomique
      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(db.exec).toHaveBeenNthCalledWith(2, "COMMIT");

      // ✅ Soldes calculés attendus
      expect(AccountDAO.updateBalance).toHaveBeenCalledWith(10, 190);
      expect(AccountDAO.updateBalance).toHaveBeenCalledWith(20, 60);

      // ✅ On vérifie que les descriptions contiennent les infos métier
      const debitArgs = TransactionDAO.create.mock.calls[0][0];
      expect(debitArgs.description).toContain("Virement interne sortant");
      expect(debitArgs.description).toContain("test");
      expect(debitArgs.description).toContain("freq=monthly");

      const creditArgs = TransactionDAO.create.mock.calls[1][0];
      expect(creditArgs.description).toContain("Virement interne entrant");
      expect(creditArgs.description).toContain("test");
      expect(creditArgs.description).toContain("freq=monthly");

      expect(res.ok).toBe(true);
      expect(res.status).toBe(201);
      expect(res.data.transfer).toEqual({ id: 999 });
      expect(res.data.balances).toEqual({ from: 190, to: 60 });
    });

    test("500 + ROLLBACK si exception pendant la transaction", async () => {
      // ✅ On force une erreur *après BEGIN* pour vérifier le rollback
      AccountDAO.findByIdAndClientId
        .mockResolvedValueOnce({ id: 10, balance: 200 })
        .mockResolvedValueOnce({ id: 20, balance: 50 });

      AccountDAO.updateBalance.mockRejectedValueOnce(new Error("DB error"));

      const res = await TransferService.createInternalTransfer({
        userId: 1,
        fromAccountId: 10,
        toAccountId: 20,
        amount: 10,
      });

      // ✅ En cas d'erreur pendant la transaction : BEGIN puis ROLLBACK
      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(db.exec).toHaveBeenNthCalledWith(2, "ROLLBACK");

      expect(res).toEqual({
        ok: false,
        status: 500,
        error: "Erreur serveur pendant le virement",
      });
    });
  });

  // =========================
  // createInteracTransfer
  // =========================
  describe("createInteracTransfer", () => {
    test("401 si non authentifié", async () => {
      const res = await TransferService.createInteracTransfer({
        userId: null,
        fromAccountId: 10,
        toClientId: 20,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 401, error: "Non authentifié" });
    });

    test("400 si montant invalide", async () => {
      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 10,
        toClientId: 20,
        amount: 0,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Montant invalide" });
    });

    test("400 si champs manquants", async () => {
      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: null,
        toClientId: 20,
        amount: 10,
      });

      expect(res).toEqual({
        ok: false,
        status: 400,
        error: "fromAccountId / toClientId manquants",
      });
    });

    test("404 si compte source introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce(null);

      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 10,
        toClientId: 20,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 404, error: "Compte source introuvable" });
    });

    test("404 si compte courant destinataire introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      AccountDAO.findCheckingByClientId.mockResolvedValueOnce(null);

      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 10,
        toClientId: 20,
        amount: 10,
      });

      expect(res).toEqual({
        ok: false,
        status: 404,
        error: "Compte courant du destinataire introuvable",
      });
    });

    test("400 si même compte", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      AccountDAO.findCheckingByClientId.mockResolvedValueOnce({ id: 10, balance: 0 });

      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 10,
        toClientId: 20,
        amount: 10,
      });

      expect(res).toEqual({
        ok: false,
        status: 400,
        error: "Impossible de transférer vers le même compte",
      });
    });

    test("400 si solde insuffisant", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 5 });
      AccountDAO.findCheckingByClientId.mockResolvedValueOnce({ id: 20, balance: 0 });

      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 10,
        toClientId: 20,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Solde insuffisant" });
    });

    test("500 + rollback si une exception survient (on couvre le catch + details)", async () => {
      // ✅ On force une exception pour s'assurer d'entrer dans le catch
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      AccountDAO.findCheckingByClientId.mockResolvedValueOnce({ id: 20, balance: 0 });
      UserDAO.findById.mockResolvedValueOnce({ id: 20, first_name: "Receiver" });

      AccountDAO.updateBalance.mockRejectedValueOnce(new Error("DB error"));

      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 10,
        toClientId: 20,
        amount: 10,
        description: "hello",
      });

      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(db.exec).toHaveBeenNthCalledWith(2, "ROLLBACK");

      expect(res.ok).toBe(false);
      expect(res.status).toBe(500);
      expect(res.error).toBe("Erreur serveur pendant le virement Interac");
      expect(typeof res.details).toBe("string");
    });

    test("500 même si ROLLBACK plante (catch interne)", async () => {
      // ✅ Ici on teste le cas où ROLLBACK échoue, mais le service doit quand même répondre 500
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      AccountDAO.findCheckingByClientId.mockResolvedValueOnce({ id: 20, balance: 0 });
      UserDAO.findById.mockResolvedValueOnce({ id: 20, first_name: "Receiver" });

      AccountDAO.updateBalance.mockRejectedValueOnce(new Error("DB error"));

      db.exec.mockImplementation(async (sql) => {
        if (sql === "ROLLBACK") throw new Error("rollback failed");
        return undefined;
      });

      const res = await TransferService.createInteracTransfer({
        userId: 1,
        fromAccountId: 10,
        toClientId: 20,
        amount: 10,
      });

      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(db.exec).toHaveBeenNthCalledWith(2, "ROLLBACK");

      expect(res.ok).toBe(false);
      expect(res.status).toBe(500);
    });
  });

  // =========================
  // payBill
  // =========================
  describe("payBill", () => {
    test("400 si montant invalide", async () => {
      const res = await TransferService.payBill({
        userId: 1,
        fromAccountId: 10,
        beneficiaryId: 5,
        amount: 0,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Montant invalide" });
    });

    test("400 si champs manquants", async () => {
      const res = await TransferService.payBill({
        userId: 1,
        fromAccountId: null,
        beneficiaryId: 5,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Champs manquants" });
    });

    test("404 si compte source introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce(null);

      const res = await TransferService.payBill({
        userId: 1,
        fromAccountId: 10,
        beneficiaryId: 5,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 404, error: "Compte source introuvable" });
    });

    test("404 si bénéficiaire introuvable", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValueOnce(null);

      const res = await TransferService.payBill({
        userId: 1,
        fromAccountId: 10,
        beneficiaryId: 5,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 404, error: "Bénéficiaire introuvable" });
    });

    test("400 si solde insuffisant", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 5 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValueOnce({ id: 5, name: "Hydro" });

      const res = await TransferService.payBill({
        userId: 1,
        fromAccountId: 10,
        beneficiaryId: 5,
        amount: 10,
      });

      expect(res).toEqual({ ok: false, status: 400, error: "Solde insuffisant" });
    });

    test("201 succès: BEGIN -> updateBalance -> create transaction -> COMMIT", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValueOnce({ id: 5, name: "Hydro" });

      AccountDAO.updateBalance.mockResolvedValueOnce({ changes: 1 });
      TransactionDAO.create.mockResolvedValueOnce({ id: 77 });

      const res = await TransferService.payBill({
        userId: 1,
        fromAccountId: 10,
        beneficiaryId: 5,
        amount: 10,
        description: "Internet",
      });

      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(db.exec).toHaveBeenNthCalledWith(2, "COMMIT");

      expect(AccountDAO.updateBalance).toHaveBeenCalledWith(10, 90);

      const txPayload = TransactionDAO.create.mock.calls[0][0];
      expect(txPayload.description).toContain("Paiement facture à Hydro");
      expect(txPayload.description).toContain("Internet");

      expect(res.ok).toBe(true);
      expect(res.status).toBe(201);
      expect(res.data.balances).toEqual({ from: 90 });
    });

    test("500 + rollback si exception", async () => {
      AccountDAO.findByIdAndClientId.mockResolvedValueOnce({ id: 10, balance: 100 });
      BeneficiaryDAO.findByIdAndUserId.mockResolvedValueOnce({ id: 5, name: "Hydro" });

      AccountDAO.updateBalance.mockRejectedValueOnce(new Error("DB error"));

      const res = await TransferService.payBill({
        userId: 1,
        fromAccountId: 10,
        beneficiaryId: 5,
        amount: 10,
      });

      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(db.exec).toHaveBeenNthCalledWith(2, "ROLLBACK");
      expect(res).toEqual({ ok: false, status: 500, error: "Erreur serveur pendant le paiement" });
    });
  });
});