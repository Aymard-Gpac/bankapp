import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * Tests unitaires du ClientDAO
 * Objectif : vérifier que les requêtes SQL sont exécutées
 * avec les bons paramètres, sans utiliser une vraie DB.
 */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn(),
  },
}));

/* =====================================================
 * Imports
 * ===================================================== */
const db = (await import("../../src/config/database.js")).default;
const { ClientDAO } = await import("../../src/models/client.model.js");

describe("ClientDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =====================================================
   * findAll
   * ===================================================== */
  describe("findAll", () => {
    test("appelle db.all avec limit et offset", async () => {
      db.all.mockResolvedValueOnce([{ id: 1 }]);

      const res = await ClientDAO.findAll(20, 40);

      expect(db.all).toHaveBeenCalledTimes(1);

      const [sql, limit, offset] = db.all.mock.calls[0];
      expect(sql).toContain("FROM users");
      expect(sql).toContain("WHERE role = 'client'");
      expect(sql).toContain("LIMIT ? OFFSET ?");
      expect(limit).toBe(20);
      expect(offset).toBe(40);

      expect(res).toEqual([{ id: 1 }]);
    });

    test("utilise les valeurs par défaut (50, 0)", async () => {
      db.all.mockResolvedValueOnce([]);

      const res = await ClientDAO.findAll();

      const [, limit, offset] = db.all.mock.calls[0];
      expect(limit).toBe(50);
      expect(offset).toBe(0);
      expect(res).toEqual([]);
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("DB error");
      db.all.mockRejectedValueOnce(err);

      await expect(ClientDAO.findAll(10, 0)).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * findById
   * ===================================================== */
  describe("findById", () => {
    test("appelle db.get avec l'id", async () => {
      const row = { id: 1, first_name: "Jean" };
      db.get.mockResolvedValueOnce(row);

      const res = await ClientDAO.findById(1);

      expect(db.get).toHaveBeenCalledTimes(1);

      const [sql, id] = db.get.mock.calls[0];
      expect(sql).toContain("FROM users");
      expect(sql).toContain("WHERE id = ? AND role = 'client'");
      expect(id).toBe(1);

      expect(res).toEqual(row);
    });

    test("retourne null si client introuvable", async () => {
      db.get.mockResolvedValueOnce(null);

      const res = await ClientDAO.findById(999);

      expect(res).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Select error");
      db.get.mockRejectedValueOnce(err);

      await expect(ClientDAO.findById(1)).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * create
   * ===================================================== */
  describe("create", () => {
    test("appelle db.run avec les bons paramètres", async () => {
      db.run.mockResolvedValueOnce({ lastID: 10, changes: 1 });

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
      };

      const res = await ClientDAO.create(payload);

      expect(db.run).toHaveBeenCalledTimes(1);

      const [sql, ...params] = db.run.mock.calls[0];

      expect(sql).toContain("INSERT INTO users");
      expect(sql).toContain("role");
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
      ]);

      expect(res).toEqual({ lastID: 10, changes: 1 });
    });

    test("insère NULL si ssn est undefined", async () => {
      db.run.mockResolvedValueOnce({ lastID: 11, changes: 1 });

      await ClientDAO.create({
        first_name: "Marie",
        last_name: "Lambert",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        date_of_birth: "",
        ssn: undefined,
        email: "marie@email.com",
        password: "hashed",
      });

      const [, , , , , , , ssn] = db.run.mock.calls[0];
      expect(ssn).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Insert error");
      db.run.mockRejectedValueOnce(err);

      await expect(
        ClientDAO.create({
          first_name: "Err",
          last_name: "User",
          address: "",
          city: "",
          state: "",
          postal_code: "",
          date_of_birth: "",
          email: "err@email.com",
          password: "hashed",
        })
      ).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * update
   * ===================================================== */
  describe("update", () => {
    test("appelle db.run avec les bons paramètres", async () => {
      db.run.mockResolvedValueOnce({ changes: 1 });

      const patch = {
        first_name: "Jean",
        last_name: "Dupont",
        address: "456 rue",
        city: "Montréal",
        state: "QC",
        postal_code: "H2H 2H2",
        date_of_birth: "1990-01-01",
        ssn: "123-45-6789",
        email: "jean@email.com",
      };

      const res = await ClientDAO.update(1, patch);

      expect(db.run).toHaveBeenCalledTimes(1);

      const [sql, ...params] = db.run.mock.calls[0];

      expect(sql).toContain("UPDATE users SET");
      expect(sql).toContain("WHERE id=? AND role='client'");
      expect(params).toEqual([
        patch.first_name,
        patch.last_name,
        patch.address,
        patch.city,
        patch.state,
        patch.postal_code,
        patch.date_of_birth,
        patch.ssn,
        patch.email,
        1,
      ]);

      expect(res).toEqual({ changes: 1 });
    });

    test("met ssn à NULL si undefined", async () => {
      db.run.mockResolvedValueOnce({ changes: 1 });

      await ClientDAO.update(1, {
        first_name: "Jean",
        last_name: "Dupont",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        date_of_birth: "",
        ssn: undefined,
        email: "jean@email.com",
      });

      const [, , , , , , , ssn] = db.run.mock.calls[0];
      expect(ssn).toBeNull();
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Update error");
      db.run.mockRejectedValueOnce(err);

      await expect(
        ClientDAO.update(1, {
          first_name: "Err",
          last_name: "User",
          address: "",
          city: "",
          state: "",
          postal_code: "",
          date_of_birth: "",
          email: "err@email.com",
        })
      ).rejects.toThrow(err);
    });
  });

  /* =====================================================
   * remove
   * ===================================================== */
  describe("remove", () => {
    test("appelle db.run avec l'id", async () => {
      db.run.mockResolvedValueOnce({ changes: 1 });

      const res = await ClientDAO.remove(1);

      expect(db.run).toHaveBeenCalledTimes(1);

      const [sql, id] = db.run.mock.calls[0];
      expect(sql).toContain("DELETE FROM users");
      expect(sql).toContain("role='client'");
      expect(id).toBe(1);

      expect(res).toEqual({ changes: 1 });
    });

    test("retourne changes=0 si client inexistant", async () => {
      db.run.mockResolvedValueOnce({ changes: 0 });

      const res = await ClientDAO.remove(999);

      expect(res).toEqual({ changes: 0 });
    });

    test("propage l'erreur DB", async () => {
      const err = new Error("Delete error");
      db.run.mockRejectedValueOnce(err);

      await expect(ClientDAO.remove(1)).rejects.toThrow(err);
    });
  });
});