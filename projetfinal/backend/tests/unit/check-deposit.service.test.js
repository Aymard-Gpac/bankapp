import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/* =====================================================
 * MOCKS
 * ===================================================== */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    exec: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  __esModule: true,
  AccountDAO: {
    findCheckingByClientId: jest.fn(),
    updateBalance: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/transaction.model.js", () => ({
  __esModule: true,
  TransactionDAO: {
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/check-deposit.model.js", () => ({
  __esModule: true,
  CheckDepositDAO: {
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

/* =====================================================
 * IMPORTS
 * ===================================================== */
const db = (await import("../../src/config/database.js")).default;
const { AccountDAO } = await import("../../src/models/bank.model.js");
const { TransactionDAO } = await import("../../src/models/transaction.model.js");
const { CheckDepositDAO } = await import("../../src/models/check-deposit.model.js");
const { CheckDepositService } = await import("../../src/services/check-deposit.service.js");

describe("CheckDepositService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.exec.mockResolvedValue();
  });

  /* =====================================================
   * VALIDATIONS
   * ===================================================== */
  test("400 si image absente", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageType: "image/png",
    });

    expect(res.status).toBe(400);
  });

  test("400 si format image invalide", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "file.pdf",
      imageType: "application/pdf",
      imageSize: 1000,
      qrCode: "BANKAPP-QR-100",
      amount: 100,
    });

    expect(res.status).toBe(400);
    expect(res.error).toContain("Format image invalide");
  });

  test("400 si taille image invalide", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "img.png",
      imageType: "image/png",
      imageSize: -10,
      qrCode: "BANKAPP-QR-100",
      amount: 100,
    });

    expect(res.status).toBe(400);
  });

  test("400 si image trop lourde", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "img.png",
      imageType: "image/png",
      imageSize: 6 * 1024 * 1024,
      qrCode: "BANKAPP-QR-100",
      amount: 100,
    });

    expect(res.status).toBe(400);
    expect(res.error).toContain("Image trop lourde");
  });

  test("400 si QR code absent", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "img.png",
      imageType: "image/png",
      imageSize: 1024,
      amount: 100,
    });

    expect(res.status).toBe(400);
  });

  test("400 si format QR invalide", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "img.png",
      imageType: "image/png",
      imageSize: 1024,
      qrCode: "INVALID-QR",
      amount: 100,
    });

    expect(res.status).toBe(400);
  });

  test("400 si montant invalide", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "img.png",
      imageType: "image/png",
      imageSize: 1024,
      qrCode: "BANKAPP-QR-100",
      amount: -10,
    });

    expect(res.status).toBe(400);
  });

  test("400 si montant ≠ QR", async () => {
    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "img.png",
      imageType: "image/png",
      imageSize: 1024,
      qrCode: "BANKAPP-QR-100",
      amount: 200,
    });

    expect(res.status).toBe(400);
    expect(res.error).toContain("ne correspond pas");
  });

  test("404 si compte chèque introuvable", async () => {
    AccountDAO.findCheckingByClientId.mockResolvedValue(null);

    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "img.png",
      imageType: "image/png",
      imageSize: 1024,
      qrCode: "BANKAPP-QR-100",
      amount: 100,
    });

    expect(res.status).toBe(404);
  });

  /* =====================================================
   * SUCCÈS
   * ===================================================== */
  test("201 succès dépôt de chèque", async () => {
    AccountDAO.findCheckingByClientId.mockResolvedValue({
      id: 10,
      balance: 500,
    });

    CheckDepositDAO.create.mockResolvedValue({ lastID: 1 });
    CheckDepositDAO.findById.mockResolvedValue({ id: 1, amount: 100 });
    AccountDAO.updateBalance.mockResolvedValue();
    TransactionDAO.create.mockResolvedValue({ id: 99 });

    const res = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "cheque.png",
      imageType: "image/png",
      imageSize: 1024,
      qrCode: "BANKAPP-QR-100",
      amount: 100,
    });

    expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(db.exec).toHaveBeenNthCalledWith(2, "COMMIT");

    expect(res.status).toBe(201);
    expect(res.data.account.balance).toBe(600);
  });

  /* =====================================================
   * ERREUR TRANSACTION
   * ===================================================== */
  test("rollback + throw si erreur DB", async () => {
    AccountDAO.findCheckingByClientId.mockResolvedValue({
      id: 10,
      balance: 500,
    });

    CheckDepositDAO.create.mockRejectedValue(new Error("DB crash"));

    await expect(
      CheckDepositService.createCheckDeposit({
        clientId: 1,
        imageName: "cheque.png",
        imageType: "image/png",
        imageSize: 1024,
        qrCode: "BANKAPP-QR-100",
        amount: 100,
      })
    ).rejects.toThrow("DB crash");

    expect(db.exec).toHaveBeenLastCalledWith("ROLLBACK");
  });
});
``