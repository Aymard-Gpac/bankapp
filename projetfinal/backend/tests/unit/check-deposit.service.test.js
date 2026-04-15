import { jest, describe, test, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    exec: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  AccountDAO: {
    findCheckingByClientId: jest.fn(),
    updateBalance: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/transaction.model.js", () => ({
  TransactionDAO: {
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/check-deposit.model.js", () => ({
  CheckDepositDAO: {
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

const db = (await import("../../src/config/database.js")).default;
const { AccountDAO } = await import("../../src/models/bank.model.js");
const { TransactionDAO } = await import("../../src/models/transaction.model.js");
const { CheckDepositDAO } = await import("../../src/models/check-deposit.model.js");
const { CheckDepositService } = await import("../../src/services/check-deposit.service.js");

describe("CheckDepositService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("retourne une erreur si le format image est invalide", async () => {
    const result = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "cheque.pdf",
      imageType: "application/pdf",
      imageSize: 1000,
      qrCode: "BANKAPP-QR-1250",
      amount: 1250,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test("effectue le dépôt et crédite le compte chèque", async () => {
    AccountDAO.findCheckingByClientId.mockResolvedValue({
      id: 10,
      balance: 500,
      type: "cheque",
    });

    CheckDepositDAO.create.mockResolvedValue({ lastID: 99 });
    CheckDepositDAO.findById.mockResolvedValue({ id: 99, amount: 1250 });
    TransactionDAO.create.mockResolvedValue({ id: 200, amount: 1250 });
    AccountDAO.updateBalance.mockResolvedValue({ changes: 1 });

    const result = await CheckDepositService.createCheckDeposit({
      clientId: 1,
      imageName: "cheque.png",
      imageType: "image/png",
      imageSize: 2048,
      qrCode: "BANKAPP-QR-1250",
      amount: 1250,
    });

    expect(db.exec).toHaveBeenCalledWith("BEGIN");
    expect(AccountDAO.updateBalance).toHaveBeenCalledWith(10, 1750);
    expect(TransactionDAO.create).toHaveBeenCalled();
    expect(db.exec).toHaveBeenCalledWith("COMMIT");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);
  });
});