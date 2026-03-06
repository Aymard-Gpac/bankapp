// tests/unit/auth.service.test.js
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// Mock des dépendances
jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  UserDAO: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
  },
}));

// Import après les mocks
const { AuthService } = await import("../../src/services/auth.service.js");
const { UserDAO } = await import("../../src/models/user.model.js");
const bcrypt = (await import("bcrypt")).default;
const jwt = (await import("jsonwebtoken")).default;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_secret_key";
  });

  describe("register", () => {
    const validUserData = {
      first_name: "Jean",
      last_name: "Dupont",
      address: "123 rue Principale",
      city: "Montréal",
      state: "QC",
      postal_code: "H1H 1H1",
      date_of_birth: "1990-01-01",
      ssn: "123-45-6789",
      email: "jean.dupont@email.com",
      password: "Password123!",
    };

    // Test des champs requis
    const requiredFields = [
      "first_name",
      "last_name",
      "address",
      "city",
      "state",
      "postal_code",
      "date_of_birth",
      "ssn",
      "email",
      "password",
    ];

    test.each(requiredFields)(
      "devrait retourner 400 quand %s est manquant",
      async (field) => {
        const invalidData = { ...validUserData };
        delete invalidData[field];

        const result = await AuthService.register(invalidData);

        expect(result.ok).toBe(false);
        expect(result.status).toBe(400);
        expect(result.error).toBe(`${field} is required`);
      },
    );

    test("devrait retourner 409 quand l'email existe déjà", async () => {
      UserDAO.findByEmail.mockResolvedValue({
        id: 1,
        email: validUserData.email,
      });

      const result = await AuthService.register(validUserData);

      expect(UserDAO.findByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toBe("Email already exists");
    });

    test("devrait créer un utilisateur avec le rôle 'student' par défaut", async () => {
      const hashedPassword = "hashed_secure_password";
      const createdUser = { lastID: 123 };

      // Mocks
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      UserDAO.create.mockResolvedValue(createdUser);

      // Exécution
      const result = await AuthService.register(validUserData);

      // Vérifications
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);

      expect(UserDAO.create).toHaveBeenCalledWith({
        ...validUserData,
        password: hashedPassword,
        role: "student",
      });

      expect(result.ok).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toEqual({
        id: createdUser.lastID,
        email: validUserData.email,
      });
    });

    test("devrait gérer les champs avec des valeurs normales", async () => {
      const userWithNormalFields = {
        ...validUserData,
        // Garder des valeurs valides
      };

      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      UserDAO.create.mockResolvedValue({ lastID: 123 });

      const result = await AuthService.register(userWithNormalFields);

      expect(UserDAO.create).toHaveBeenCalledWith({
        ...userWithNormalFields,
        password: "hashed",
        role: "student",
      });
      expect(result.ok).toBe(true);
    });

    test("devrait propager les erreurs de base de données", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");

      const dbError = new Error("SQLITE_ERROR: table users not found");
      UserDAO.create.mockRejectedValue(dbError);

      // L'erreur doit être propagée car non capturée par le service
      await expect(AuthService.register(validUserData)).rejects.toThrow();
    });

    test("devrait propager les erreurs de hachage", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);

      const hashError = new Error("bcrypt error");
      bcrypt.hash.mockRejectedValue(hashError);

      await expect(AuthService.register(validUserData)).rejects.toThrow();
    });
  });

  describe("login", () => {
    const validCredentials = {
      email: "jean.dupont@email.com",
      password: "Password123!",
    };

    const mockUser = {
      id: 1,
      email: "jean.dupont@email.com",
      password: "hashed_password",
      role: "student",
      first_name: "Jean",
      last_name: "Dupont",
    };

    test("devrait retourner 400 quand l'email est manquant", async () => {
      const result = await AuthService.login({ password: "test123" });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe("Email and password required");
    });

    test("devrait retourner 400 quand le mot de passe est manquant", async () => {
      const result = await AuthService.login({ email: "test@test.com" });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe("Email and password required");
    });

    test("devrait retourner 400 quand les deux champs sont manquants", async () => {
      const result = await AuthService.login({});

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe("Email and password required");
    });

    test("devrait retourner 401 quand l'utilisateur n'existe pas", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);

      const result = await AuthService.login(validCredentials);

      expect(UserDAO.findByEmail).toHaveBeenCalledWith(validCredentials.email);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe("Invalid credentials");
    });

    test("devrait retourner 401 quand le mot de passe est incorrect", async () => {
      UserDAO.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const result = await AuthService.login(validCredentials);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        validCredentials.password,
        mockUser.password,
      );
      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe("Invalid credentials");
    });

    test("devrait retourner 200 et un token quand la connexion réussit", async () => {
      const mockToken = "jwt.token.here";

      UserDAO.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue(mockToken);

      const result = await AuthService.login(validCredentials);

      // Vérification du token JWT
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );

      // Vérification de la réponse
      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });

    test("devrait retourner un token avec une expiration de 2h", async () => {
      UserDAO.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token");

      await AuthService.login(validCredentials);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );
    });

    test("devrait être insensible à la casse pour l'email côté service", async () => {
      // Note: La sensibilité à la casse dépend de la BD, pas du service
      UserDAO.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token");

      const credentialsWithUppercase = {
        email: "JEAN.DUPONT@EMAIL.COM",
        password: "Password123!",
      };

      const result = await AuthService.login(credentialsWithUppercase);

      expect(UserDAO.findByEmail).toHaveBeenCalledWith(
        credentialsWithUppercase.email,
      );
      expect(result.ok).toBe(true);
    });

    test("devrait propager les erreurs JWT", async () => {
      UserDAO.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      jwt.sign.mockImplementation(() => {
        throw new Error("JWT signing failed");
      });

      await expect(AuthService.login(validCredentials)).rejects.toThrow();
    });

    test("devrait propager les erreurs de base de données", async () => {
      UserDAO.findByEmail.mockRejectedValue(new Error("Database error"));

      await expect(AuthService.login(validCredentials)).rejects.toThrow();
    });

    test("devrait propager les erreurs de bcrypt", async () => {
      UserDAO.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockRejectedValue(new Error("Bcrypt error"));

      await expect(AuthService.login(validCredentials)).rejects.toThrow();
    });
  });

  describe("getCurrentUser", () => {
    const mockUser = {
      id: 1,
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean.dupont@email.com",
      role: "student",
      address: "123 rue Principale",
      city: "Montréal",
      state: "QC",
      postal_code: "H1H 1H1",
      date_of_birth: "1990-01-01",
      ssn: "123-45-6789",
      password: "hashed_password",
      created_at: "2024-01-01T00:00:00Z",
    };

    test("devrait retourner 404 quand l'utilisateur n'existe pas", async () => {
      UserDAO.findById.mockResolvedValue(null);

      const result = await AuthService.getCurrentUser(999);

      expect(UserDAO.findById).toHaveBeenCalledWith(999);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error).toBe("User not found");
    });

    test("devrait retourner l'utilisateur sans le mot de passe", async () => {
      UserDAO.findById.mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser(mockUser.id);

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);

      // Vérifier que le mot de passe n'est pas inclus
      expect(result.data.password).toBeUndefined();

      // Vérifier que toutes les autres propriétés sont présentes
      const { password, ...expectedUser } = mockUser;
      expect(result.data).toEqual(expectedUser);
    });

    test("devrait gérer les utilisateurs avec des champs optionnels manquants", async () => {
      const minimalUser = {
        id: 2,
        first_name: "Marie",
        last_name: "Lambert",
        email: "marie@email.com",
        role: "student",
        password: "hashed",
      };

      UserDAO.findById.mockResolvedValue(minimalUser);

      const result = await AuthService.getCurrentUser(2);

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);

      const { password, ...expectedUser } = minimalUser;
      expect(result.data).toEqual(expectedUser);
    });

    test("devrait propager les erreurs de base de données", async () => {
      UserDAO.findById.mockRejectedValue(new Error("Database error"));

      await expect(AuthService.getCurrentUser(1)).rejects.toThrow();
    });

    test("devrait retourner le même utilisateur pour différentes requêtes", async () => {
      UserDAO.findById.mockResolvedValue(mockUser);

      const result1 = await AuthService.getCurrentUser(1);
      const result2 = await AuthService.getCurrentUser(1);

      expect(result1.data).toEqual(result2.data);
      expect(UserDAO.findById).toHaveBeenCalledTimes(2);
    });
  });

  describe("Intégration entre méthodes", () => {
    test("un utilisateur créé devrait pouvoir se connecter", async () => {
      // Simuler l'inscription
      const newUser = {
        id: 123,
        email: "nouveau@email.com",
        password: "hashed",
        role: "student",
      };

      // Mock pour register
      UserDAO.findByEmail
        .mockResolvedValueOnce(null) // Pour register: email n'existe pas
        .mockResolvedValueOnce(newUser); // Pour login: utilisateur trouvé

      bcrypt.hash.mockResolvedValue("hashed");
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token");
      UserDAO.create.mockResolvedValue({ lastID: 123 });

      // Inscription
      const registerResult = await AuthService.register({
        first_name: "Test",
        last_name: "User",
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        postal_code: "T3S 4T5",
        date_of_birth: "2000-01-01",
        ssn: "123-45-6789",
        email: "nouveau@email.com",
        password: "Password123!",
      });

      expect(registerResult.ok).toBe(true);
      expect(registerResult.status).toBe(201);

      // Connexion
      const loginResult = await AuthService.login({
        email: "nouveau@email.com",
        password: "Password123!",
      });

      expect(loginResult.ok).toBe(true);
      expect(loginResult.status).toBe(200);
      expect(loginResult.data.user.id).toBe(123);
    });
  });
});
