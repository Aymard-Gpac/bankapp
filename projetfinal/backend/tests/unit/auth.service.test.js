import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/* =====================================================
 * MOCKS
 * ===================================================== */
jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  __esModule: true,
  UserDAO: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
  },
}));

/* =====================================================
 * IMPORTS
 * ===================================================== */
const { AuthService } = await import("../../src/services/auth.service.js");
const { UserDAO } = await import("../../src/models/user.model.js");
const bcrypt = (await import("bcrypt")).default;
const jwt = (await import("jsonwebtoken")).default;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_secret";
  });

  /* =====================================================
   * REGISTER
   * ===================================================== */
  describe("register", () => {
    const validUser = {
      first_name: "Jean",
      last_name: "Dupont",
      address: "123 rue Principale",
      city: "Montréal",
      state: "QC",
      postal_code: "H1H 1H1",
      date_of_birth: "1990-01-01",
      ssn: "123-45-6789",
      email: "jean@test.com",
      password: "Password123!",
    };

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
      "400 si le champ requis %s est manquant",
      async (field) => {
        const invalid = { ...validUser };
        delete invalid[field];

        const res = await AuthService.register(invalid);

        expect(res.status).toBe(400);
        expect(res.error).toBe(`${field} is required`);
      }
    );

    test("✅ traverse complètement la boucle des champs requis", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      UserDAO.create.mockResolvedValue({ lastID: 42 });

      const res = await AuthService.register(validUser);

      expect(res.ok).toBe(true);
      expect(res.status).toBe(201);
    });

    test("409 si email déjà existant", async () => {
      UserDAO.findByEmail.mockResolvedValue({ id: 1 });

      const res = await AuthService.register(validUser);

      expect(res.status).toBe(409);
      expect(res.error).toBe("Email already exists");
    });

    test("propage erreur bcrypt", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockRejectedValue(new Error("bcrypt error"));

      await expect(AuthService.register(validUser)).rejects.toThrow();
    });

    test("propage erreur DB", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");
      UserDAO.create.mockRejectedValue(new Error("DB error"));

      await expect(AuthService.register(validUser)).rejects.toThrow();
    });
  });

  /* =====================================================
   * LOGIN
   * ===================================================== */
  describe("login", () => {
    const credentials = {
      email: "jean@test.com",
      password: "Password123!",
    };

    const user = {
      id: 1,
      email: "jean@test.com",
      password: "hashed",
      role: "student",
    };

    test("400 si email ou password manquant", async () => {
      const res = await AuthService.login({});
      expect(res.status).toBe(400);
    });

    test("✅ branche FALSE du if (!email || !password)", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);

      await AuthService.login(credentials);

      expect(UserDAO.findByEmail).toHaveBeenCalled();
    });

    test("401 si utilisateur introuvable", async () => {
      UserDAO.findByEmail.mockResolvedValue(null);

      const res = await AuthService.login(credentials);

      expect(res.status).toBe(401);
    });

    test("401 si mot de passe incorrect", async () => {
      UserDAO.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      const res = await AuthService.login(credentials);

      expect(res.status).toBe(401);
    });

    test("200 succès", async () => {
      UserDAO.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token");

      const res = await AuthService.login(credentials);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      expect(res.status).toBe(200);
    });

    test("❗ JWT_SECRET manquant → throw", async () => {
      delete process.env.JWT_SECRET;

      UserDAO.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockImplementation(() => {
        throw new Error("secret missing");
      });

      await expect(AuthService.login(credentials)).rejects.toThrow();
    });

    test("propage erreur bcrypt.compare", async () => {
      UserDAO.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockRejectedValue(new Error("bcrypt"));

      await expect(AuthService.login(credentials)).rejects.toThrow();
    });
  });

  /* =====================================================
   * getCurrentUser
   * ===================================================== */
  describe("getCurrentUser", () => {
    test("404 si utilisateur introuvable", async () => {
      UserDAO.findById.mockResolvedValue(null);

      const res = await AuthService.getCurrentUser(99);

      expect(res.status).toBe(404);
    });

    test("retourne utilisateur sans password", async () => {
      UserDAO.findById.mockResolvedValue({
        id: 1,
        email: "a@test.com",
        role: "student",
        password: "hashed",
      });

      const res = await AuthService.getCurrentUser(1);

      expect(res.data.password).toBeUndefined();
    });

    test("fonctionne même sans champ password", async () => {
      UserDAO.findById.mockResolvedValue({
        id: 2,
        email: "b@test.com",
        role: "student",
      });

      const res = await AuthService.getCurrentUser(2);

      expect(res.ok).toBe(true);
    });

    test("propage erreur DB", async () => {
      UserDAO.findById.mockRejectedValue(new Error("DB error"));

      await expect(AuthService.getCurrentUser(1)).rejects.toThrow();
    });
  });
});
