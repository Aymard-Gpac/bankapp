import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * Tests unitaires du UserDAO
 * Objectif : vérifier que les requêtes SQL sont exécutées
 * avec les bons paramètres, sans toucher à une vraie base de données.
 */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    run: jest.fn(),
  },
}));

/* =====================================================
 * Imports
 * ===================================================== */
const db = (await import("../../src/config/database.js")).default;
const { UserDAO } = await import("../../src/models/user.model.js");

describe("UserDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * findByEmail
   * ===================================================== */
  describe("findByEmail", () => {
    test("appelle db.get avec le bon email", async () => {
      const row = {
        id: 1,
        email: "jean@email.com",
        role: "client",
      };

      db.get.mockResolvedValueOnce(row);

      const res = await UserDAO.findByEmail("jean@email.com");

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, email] = db.get.mock.calls[0];
      expect(sql).toBe("SELECT * FROM users WHERE email = ?");
      expect(email).toBe("jean@email.com");

      expect(res).toEqual(row);
    });

    test("retourne null si aucun utilisateur trouvé", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await UserDAO.findByEmail("absent@email.com");

      expect(res).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("DB error");
      db.get.mockRejectedValueOnce(err);

      await expect(
        UserDAO.findByEmail("error@email.com")
      ).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * findById
   * ===================================================== */
  describe("findById", () => {
    test("appelle db.get avec l'id", async () => {
      const row = {
        id: 10,
        email: "client@email.com",
        role: "client",
      };

      db.get.mockResolvedValueOnce(row);

      const res = await UserDAO.findById(10);

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, id] = db.get.mock.calls[0];
      expect(sql).toBe("SELECT * FROM users WHERE id = ?");
      expect(id).toBe(10);

      expect(res).toEqual(row);
    });

    test("retourne null si utilisateur introuvable", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await UserDAO.findById(999);

      expect(res).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("DB error");
      db.get.mockRejectedValueOnce(err);

      await expect(UserDAO.findById(1)).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * create
   * ===================================================== */
  describe("create", () => {
    test("appelle db.run avec les bons paramètres", async () => {
      db.run.mockResolvedValueOnce({ lastID: 42, changes: 1 });

      const payload = {
        first_name: "Jean",
        last_name: "Dupont",
        address: "123 rue Principale",
        city: "Montréal",
        state: "QC",
        postal_code: "H1H 1H1",
        date_of_birth: "1990-01-01",
        ssn: "123-45-6789",
        email: "jean@email.com",
        password: "hashed",
        role: "client",
      };

      const res = await UserDAO.create(payload);

      expect(db.run).toHaveBeenCalledTimes(1);

      const [sql, ...params] = db.run.mock.calls[0];

      expect(sql).toContain("INSERT INTO users");
      expect(params).toEqual([
        payload.first_name,
        payload.last_name,
        payload.address,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.date_of_birth,
        payload.ssn,
        payload.email,
        payload.password,
        payload.role,
      ]);

      expect(res).toEqual({ lastID: 42, changes: 1 });
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Insert error");
      db.run.mockRejectedValueOnce(err);

      await expect(
        UserDAO.create({
          first_name: "Err",
          last_name: "User",
          address: "",
          city: "",
          state: "",
          postal_code: "",
          date_of_birth: "",
          ssn: "",
          email: "err@email.com",
          password: "hashed",
          role: "client",
        })
      ).rejects.toThrow(err);
    });
  });
});
