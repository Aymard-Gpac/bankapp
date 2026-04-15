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

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  __esModule: true,
  UserDAO: {
    findByEmail: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/client.model.js", () => ({
  __esModule: true,
  ClientDAO: {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  __esModule: true,
  AccountDAO: {
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
}));

/* =====================================================
 * IMPORTS
 * ===================================================== */
const db = (await import("../../src/config/database.js")).default;
const { ClientService } = await import("../../src/services/client.service.js");
const { UserDAO } = await import("../../src/models/user.model.js");
const { ClientDAO } = await import("../../src/models/client.model.js");
const { AccountDAO } = await import("../../src/models/bank.model.js");
const bcrypt = (await import("bcrypt")).default;

describe("ClientService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.exec.mockResolvedValue();
  });

  /* =====================================================
   * createClientWithDefaultAccounts
   * ===================================================== */
  describe("createClientWithDefaultAccounts", () => {
    const validClient = {
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean@email.com",
      address: "123 rue Principale",
      city: "Montréal",
      state: "QC",
      postal_code: "H1H 1H1",
      date_of_birth: "1990-01-01",
      password: "Password123!",
    };

    test("400 si champs requis manquants", async () => {
      const res = await ClientService.createClientWithDefaultAccounts({});
      expect(res.status).toBe(400);
    });

    test("409 si email déjà existant", async () => {
      UserDAO.findByEmail.mockResolvedValue({ id: 1 });

      const res =
        await ClientService.createClientWithDefaultAccounts(validClient);

      expect(res.status).toBe(409);
      expect(res.error).toBe("Email already exists");
    });

    test("génère un mot de passe si non fourni", async () => {
      const data = { ...validClient };
      delete data.password;

      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      ClientDAO.create.mockResolvedValue({ lastID: 1 });
      AccountDAO.create.mockResolvedValue({});

      const res =
        await ClientService.createClientWithDefaultAccounts(data);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(res.status).toBe(201);
    });

    test("crée le client et les 3 comptes par défaut", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      ClientDAO.create.mockResolvedValue({ lastID: 10 });
      AccountDAO.create.mockResolvedValue({});

      const res =
        await ClientService.createClientWithDefaultAccounts(validClient);

      expect(db.exec).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(AccountDAO.create).toHaveBeenCalledTimes(3);
      expect(db.exec).toHaveBeenLastCalledWith("COMMIT");

      expect(res.data).toEqual({
        userId: 10,
        message: "Client created + 3 accounts created",
      });
    });

    test("ROLLBACK + 500 si erreur pendant la transaction", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      ClientDAO.create.mockResolvedValue({ lastID: 5 });
      AccountDAO.create.mockRejectedValue(new Error("DB crash"));

      const res =
        await ClientService.createClientWithDefaultAccounts(validClient);

      expect(db.exec).toHaveBeenLastCalledWith("ROLLBACK");
      expect(res.status).toBe(500);

      spy.mockRestore();
    });
  });

  /* =====================================================
   * list
   * ===================================================== */
  describe("list", () => {
    test("retourne les clients avec pagination par défaut", async () => {
      ClientDAO.findAll.mockResolvedValue([{ id: 1 }]);

      const res = await ClientService.list({});

      expect(ClientDAO.findAll).toHaveBeenCalledWith(50, 0);
      expect(res.ok).toBe(true);
    });

    test("plafonne limit à 100", async () => {
      ClientDAO.findAll.mockResolvedValue([]);

      await ClientService.list({ limit: 500 });

      expect(ClientDAO.findAll).toHaveBeenCalledWith(100, 0);
    });
  });

  /* =====================================================
   * get
   * ===================================================== */
  describe("get", () => {
    test("200 si client trouvé", async () => {
      ClientDAO.findById.mockResolvedValue({ id: 1 });

      const res = await ClientService.get(1);

      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
    });

    test("404 si client introuvable", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      const res = await ClientService.get(99);

      expect(res.status).toBe(404);
    });
  });

  /* =====================================================
   * update
   * ===================================================== */
  describe("update", () => {
    const existing = {
      id: 1,
      email: "jean@email.com",
      first_name: "Jean",
    };

    test("404 si client inexistant", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      const res = await ClientService.update(1, { first_name: "Test" });

      expect(res.status).toBe(404);
    });

    test("409 si email déjà utilisé", async () => {
      ClientDAO.findById.mockResolvedValue(existing);
      UserDAO.findByEmail.mockResolvedValue({ id: 2 });

      const res = await ClientService.update(1, {
        email: "autre@email.com",
      });

      expect(res.status).toBe(409);
    });

    test("200 mise à jour réussie", async () => {
      ClientDAO.findById.mockResolvedValue(existing);
      ClientDAO.update.mockResolvedValue();

      const res = await ClientService.update(1, {
        first_name: "Jean-Pierre",
      });

      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
    });
  });

  /* =====================================================
   * remove
   * ===================================================== */
  describe("remove", () => {
    test("404 si client inexistant", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      const res = await ClientService.remove(1);

      expect(res.status).toBe(404);
    });

    test("200 suppression réussie", async () => {
      ClientDAO.findById.mockResolvedValue({ id: 1 });
      ClientDAO.remove.mockResolvedValue();

      const res = await ClientService.remove(1);

      expect(res.status).toBe(200);
      expect(res.data.message).toBe("Deleted");
    });
  });

  /* =====================================================
   * getCurrentClient
   * ===================================================== */
  describe("getCurrentClient", () => {
    test("retourne le client courant", async () => {
      ClientDAO.findById.mockResolvedValue({ id: 1 });

      const res = await ClientService.getCurrentClient(1);

      expect(res).toEqual({ id: 1 });
    });

    test("throw 404 si client introuvable", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      await expect(
        ClientService.getCurrentClient(99)
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
