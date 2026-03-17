
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// Mock des dépendances
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    exec: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  UserDAO: {
    findByEmail: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/client.model.js", () => ({
  ClientDAO: {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/models/bank.model.js", () => ({
  AccountDAO: {
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn(),
  },
}));

// Import après les mocks
const db = (await import("../../src/config/database.js")).default;
const { ClientService } = await import("../../src/services/client.service.js");
const { UserDAO } = await import("../../src/models/user.model.js");
const { ClientDAO } = await import("../../src/models/client.model.js");
const { AccountDAO } = await import("../../src/models/bank.model.js");
const bcrypt = (await import("bcrypt")).default;

describe("ClientService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createClientWithDefaultAccounts", () => {
    const validClientData = {
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean.dupont@email.com",
      address: "123 rue Principale",
      city: "Montréal",
      state: "QC",
      postal_code: "H1H 1H1",
      date_of_birth: "1990-01-01",
      password: "Password123!",
    };

    test("devrait retourner 400 quand first_name est manquant", async () => {
      const invalidData = { ...validClientData, first_name: undefined };
      const result =
        await ClientService.createClientWithDefaultAccounts(invalidData);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain("first_name");
    });

    test("devrait retourner 400 quand last_name est manquant", async () => {
      const invalidData = { ...validClientData, last_name: undefined };
      const result =
        await ClientService.createClientWithDefaultAccounts(invalidData);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain("last_name");
    });

    test("devrait retourner 400 quand email est manquant", async () => {
      const invalidData = { ...validClientData, email: undefined };
      const result =
        await ClientService.createClientWithDefaultAccounts(invalidData);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain("email");
    });

    test("devrait retourner 409 quand l'email existe déjà", async () => {
      UserDAO.findByEmail.mockResolvedValue({
        id: 1,
        email: validClientData.email,
      });

      const result =
        await ClientService.createClientWithDefaultAccounts(validClientData);

      expect(UserDAO.findByEmail).toHaveBeenCalledWith(validClientData.email);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toBe("Email already exists");
    });

    test("devrait générer un mot de passe aléatoire si non fourni", async () => {
      const dataWithoutPassword = { ...validClientData };
      delete dataWithoutPassword.password;

      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed_password");
      ClientDAO.create.mockResolvedValue({ lastID: 123 });

      // Mock des appels DB
      db.exec.mockResolvedValue();
      AccountDAO.create.mockResolvedValue({});

      const result =
        await ClientService.createClientWithDefaultAccounts(
          dataWithoutPassword,
        );

      // Vérifier que bcrypt.hash a été appelé avec un mot de passe généré
      expect(bcrypt.hash).toHaveBeenCalled();
      const hashCall = bcrypt.hash.mock.calls[0];
      expect(hashCall[0]).toMatch(/^[a-z0-9]{8,}A1!$/i); // Format du mot de passe généré

      expect(result.ok).toBe(true);
      expect(result.status).toBe(201);
    });

    test("devrait créer un client avec les champs optionnels vides par défaut", async () => {
      const minimalData = {
        first_name: "Marie",
        last_name: "Lambert",
        email: "marie@email.com",
        password: "Password123!",
      };

      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed_password");
      ClientDAO.create.mockResolvedValue({ lastID: 456 });
      db.exec.mockResolvedValue();
      AccountDAO.create.mockResolvedValue({});

      const result =
        await ClientService.createClientWithDefaultAccounts(minimalData);

      // Vérifier que les champs optionnels sont initialisés avec des chaînes vides
      expect(ClientDAO.create).toHaveBeenCalledWith({
        first_name: "Marie",
        last_name: "Lambert",
        email: "marie@email.com",
        password: "hashed_password",
        role: "client",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        date_of_birth: "",
        ssn: "",
      });

      expect(result.ok).toBe(true);
    });

    test("devrait créer 3 comptes par défaut (chèque, épargne, crédit)", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      ClientDAO.create.mockResolvedValue({ lastID: 789 });
      db.exec.mockResolvedValue();

      const result =
        await ClientService.createClientWithDefaultAccounts(validClientData);

      // Vérifier que 3 comptes ont été créés
      expect(AccountDAO.create).toHaveBeenCalledTimes(3);

      // Vérifier les types de comptes
      const accountCalls = AccountDAO.create.mock.calls;
      const accountTypes = accountCalls.map((call) => call[0].type);

      expect(accountTypes).toContain("cheque");
      expect(accountTypes).toContain("epargne");
      expect(accountTypes).toContain("credit");

      // Vérifier que tous les comptes sont liés au bon client
      accountCalls.forEach((call) => {
        expect(call[0].client_id).toBe(789);
        expect(call[0].balance).toBe(0);
        expect(call[0].currency).toBe("CAD");
        expect(call[0].account_number).toBeDefined();
        expect(call[0].account_number).toMatch(/^(CHEQUE|EPARGNE|CREDIT)/);
      });

      expect(result.data).toEqual({
        userId: 789,
        message: "Client created + 3 accounts created",
      });
    });

    test("devrait gérer les transactions avec BEGIN/COMMIT", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      ClientDAO.create.mockResolvedValue({ lastID: 123 });
      AccountDAO.create.mockResolvedValue({});
      db.exec.mockResolvedValue();

      await ClientService.createClientWithDefaultAccounts(validClientData);

      // Vérifier l'ordre des transactions
      expect(db.exec.mock.calls[0][0]).toBe("BEGIN");
      expect(db.exec.mock.calls[db.exec.mock.calls.length - 1][0]).toBe(
        "COMMIT",
      );
    });

    test("devrait faire ROLLBACK en cas d'erreur et retourner 500", async () => {
      // Espionner console.error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      ClientDAO.create.mockResolvedValue({ lastID: 123 });

      // Simuler une erreur lors de la création des comptes
      AccountDAO.create.mockRejectedValue(new Error("Database error"));
      db.exec.mockResolvedValue();

      const result =
        await ClientService.createClientWithDefaultAccounts(validClientData);

      // Vérifier que console.error a été appelé
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "createClientWithDefaultAccounts error:",
        expect.any(Error),
      );

      // Vérifier le ROLLBACK
      expect(db.exec).toHaveBeenLastCalledWith("ROLLBACK");

      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(result.error).toBe("Internal server error");

      // Restaurer console.error
      consoleSpy.mockRestore();
    });

    test("devrait logger l'erreur en cas d'échec", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      ClientDAO.create.mockRejectedValue(new Error("Creation failed"));

      const result =
        await ClientService.createClientWithDefaultAccounts(validClientData);

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.status).toBe(500);

      consoleSpy.mockRestore();
    });
  });

  describe("list", () => {
    test("devrait retourner la liste des clients avec les limites par défaut", async () => {
      const mockClients = [
        { id: 1, first_name: "Jean", last_name: "Dupont" },
        { id: 2, first_name: "Marie", last_name: "Lambert" },
      ];

      ClientDAO.findAll.mockResolvedValue(mockClients);

      const result = await ClientService.list({});

      expect(ClientDAO.findAll).toHaveBeenCalledWith(50, 0);
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockClients);
    });

    test("devrait appliquer les paramètres limit et offset", async () => {
      ClientDAO.findAll.mockResolvedValue([]);

      await ClientService.list({ limit: 20, offset: 10 });

      expect(ClientDAO.findAll).toHaveBeenCalledWith(20, 10);
    });

    test("devrait limiter le limit à 100 maximum", async () => {
      ClientDAO.findAll.mockResolvedValue([]);

      await ClientService.list({ limit: 200, offset: 0 });

      expect(ClientDAO.findAll).toHaveBeenCalledWith(100, 0);
    });
  });

  describe("get", () => {
    test("devrait retourner un client par son ID", async () => {
      const mockClient = { id: 1, first_name: "Jean", last_name: "Dupont" };
      ClientDAO.findById.mockResolvedValue(mockClient);

      const result = await ClientService.get(1);

      expect(ClientDAO.findById).toHaveBeenCalledWith(1);
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockClient);
    });

    test("devrait retourner 404 si le client n'existe pas", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      const result = await ClientService.get(999);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error).toBe("Client not found");
    });
  });

  describe("update", () => {
    const existingClient = {
      id: 1,
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean@email.com",
      address: "123 rue Principale",
    };

    test("devrait mettre à jour un client existant", async () => {
      ClientDAO.findById.mockResolvedValue(existingClient);
      ClientDAO.update.mockResolvedValue();

      const updates = {
        first_name: "Jean-Pierre",
        address: "456 Nouvelle Rue",
      };
      const result = await ClientService.update(1, updates);

      expect(ClientDAO.update).toHaveBeenCalledWith(1, {
        ...existingClient,
        ...updates,
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
    });

    test("devrait retourner 404 si le client n'existe pas", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      const result = await ClientService.update(999, { first_name: "New" });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });

    test("devrait vérifier l'unicité de l'email si modifié", async () => {
      ClientDAO.findById.mockResolvedValue(existingClient);

      // Simuler un email déjà utilisé par un autre client
      UserDAO.findByEmail.mockResolvedValue({
        id: 2,
        email: "nouveau@email.com",
      });

      const result = await ClientService.update(1, {
        email: "nouveau@email.com",
      });

      expect(UserDAO.findByEmail).toHaveBeenCalledWith("nouveau@email.com");
      expect(result.ok).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toBe("Email already used");
    });

    test("devrait permettre de garder le même email", async () => {
      ClientDAO.findById.mockResolvedValue(existingClient);

      // Même email que celui existant
      const result = await ClientService.update(1, { email: "jean@email.com" });

      expect(UserDAO.findByEmail).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe("remove", () => {
    test("devrait supprimer un client existant", async () => {
      ClientDAO.findById.mockResolvedValue({ id: 1, first_name: "Jean" });
      ClientDAO.remove.mockResolvedValue();

      const result = await ClientService.remove(1);

      expect(ClientDAO.remove).toHaveBeenCalledWith(1);
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data.message).toBe("Deleted");
    });

    test("devrait retourner 404 si le client n'existe pas", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      const result = await ClientService.remove(999);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });
  });

  describe("getCurrentClient", () => {
    test("devrait retourner le client courant", async () => {
      const mockClient = { id: 1, first_name: "Jean", last_name: "Dupont" };
      ClientDAO.findById.mockResolvedValue(mockClient);

      const result = await ClientService.getCurrentClient(1);

      expect(result).toEqual(mockClient);
    });

    test("devrait lancer une erreur 404 si le client n'existe pas", async () => {
      ClientDAO.findById.mockResolvedValue(null);

      await expect(ClientService.getCurrentClient(999)).rejects.toThrow(
        "Client not found",
      );

      try {
        await ClientService.getCurrentClient(999);
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });
  });
});
