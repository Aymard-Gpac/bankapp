import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * Tests unitaires du CheckDepositDAO
 * Objectif : vérifier que les requêtes SQL sont appelées
 * avec les bons paramètres, sans toucher à la vraie DB.
 */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    run: jest.fn(),
    get: jest.fn(),
  },
}));

/* ============================
 * Imports
 * ============================ */
const db = (await import("../../src/config/database.js")).default;
const { CheckDepositDAO } = await import(
  "../../src/models/check-deposit.model.js"
);

describe("CheckDepositDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * create
   * ===================================================== */
  describe("create", () => {
    test("appelle db.run avec les bons paramètres", async () => {
      db.run.mockResolvedValueOnce({ lastID: 1, changes: 1 });

      const payload = {
        userId: 5,
        accountId: 10,
        imageName: "cheque.png",
        imageType: "image/png",
        imageSize: 2048,
        qrCode: "BANKAPP-QR-100",
        amount: 100,
        status: "validated",
      };

      const res = await CheckDepositDAO.create(payload);

      expect(db.run).toHaveBeenCalledTimes(1);

      const [sql, ...params] = db.run.mock.calls[0];

      expect(sql).toContain("INSERT INTO check_deposits");
      expect(params).toEqual([
        payload.userId,
        payload.accountId,
        payload.imageName,
        payload.imageType,
        payload.imageSize,
        payload.qrCode,
        payload.amount,
        payload.status,
      ]);

      expect(res).toEqual({ lastID: 1, changes: 1 });
    });

    test("utilise le status par défaut si non fourni", async () => {
      db.run.mockResolvedValueOnce({ lastID: 2, changes: 1 });

      const res = await CheckDepositDAO.create({
        userId: 1,
        accountId: 2,
        imageName: "img.jpg",
        imageType: "image/jpeg",
        imageSize: 1000,
        qrCode: "BANKAPP-QR-50",
        amount: 50,
      });

      const [, , , , , , , status] = db.run.mock.calls[0];
      expect(status).toBe(50);

      expect(res).toEqual({ lastID: 2, changes: 1 });
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Insert error");
      db.run.mockRejectedValueOnce(err);

      await expect(
        CheckDepositDAO.create({
          userId: 1,
          accountId: 1,
          imageName: "err.png",
          imageType: "image/png",
          imageSize: 100,
          qrCode: "BANKAPP-QR-10",
          amount: 10,
        })
      ).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * findById
   * ===================================================== */
  describe("findById", () => {
    test("appelle db.get avec l'id", async () => {
      const row = { id: 1, amount: 100 };
      db.get.mockResolvedValueOnce(row);

      const res = await CheckDepositDAO.findById(1);

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, id] = db.get.mock.calls[0];
      expect(sql).toContain("FROM check_deposits");
      expect(sql).toContain("WHERE id = ?");
      expect(id).toBe(1);

      expect(res).toEqual(row);
    });

    test("retourne null si dépôt introuvable", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await CheckDepositDAO.findById(999);

      expect(res).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Select error");
      db.get.mockRejectedValueOnce(err);

      await expect(CheckDepositDAO.findById(1)).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * findByQrCode
   * ===================================================== */
  describe("findByQrCode", () => {
    test("appelle db.get avec le QR code", async () => {
      const row = { id: 5, qr_code: "BANKAPP-QR-100" };
      db.get.mockResolvedValueOnce(row);

      const res = await CheckDepositDAO.findByQrCode("BANKAPP-QR-100");

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, qrCode] = db.get.mock.calls[0];
      expect(sql).toContain("WHERE qr_code = ?");
      expect(qrCode).toBe("BANKAPP-QR-100");

      expect(res).toEqual(row);
    });

    test("retourne null si aucun dépôt correspondant", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await CheckDepositDAO.findByQrCode("UNKNOWN-QR");

      expect(res).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("QR select error");
      db.get.mockRejectedValueOnce(err);

      await expect(
        CheckDepositDAO.findByQrCode("BANKAPP-QR-100")
      ).rejects.toThrow(err);
    });
  });
});
