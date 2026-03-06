import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * Objectif de ce fichier:
 * Tester le DAO (data access layer) = vérifier que les fonctions du DAO
 * appellent la DB avec le bon SQL + les bons paramètres.
 *
 * Ici, on ne teste PAS la vraie base de données.
 * On mock db.all / db.get / db.run pour capturer les requêtes.
 */
jest.unstable_mockModule("../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    all: jest.fn(), // pour SELECT qui retourne plusieurs lignes
    get: jest.fn(), // pour SELECT qui retourne une seule ligne
    run: jest.fn(), // pour INSERT / UPDATE / DELETE
  },
}));

//  On importe la "fausse" DB mockée
const db = (await import("../../src/config/database.js")).default;

//  On importe le DAO réel (qui utilise db.* en interne)
const { BeneficiaryDAO } = await import("../../src/models/beneficiary.model.js");

describe("BeneficiaryDAO", () => {
  beforeEach(() => {
    //  Nettoie les appels précédents (important pour éviter que les tests se mélangent)
    jest.clearAllMocks();
  });

  test("listByUserId() appelle db.all avec le bon SQL + userId", async () => {
    //  On simule ce que la DB devrait renvoyer
    db.all.mockResolvedValueOnce([{ id: 1 }]);

    //  On exécute la fonction DAO à tester
    const res = await BeneficiaryDAO.listByUserId(5);

    //  On vérifie que db.all a bien été appelée une seule fois
    expect(db.all).toHaveBeenCalledTimes(1);

    /**
     *  On récupère les arguments passés à db.all :
     * - sql: la requête
     * - userId: le paramètre lié au "?"
     *
     * Note: on ne compare pas la requête complète au caractère près,
     * car les espaces/retours à la ligne peuvent varier.
     * On vérifie plutôt des morceaux importants ("contains").
     */
    const [sql, userId] = db.all.mock.calls[0];
    expect(sql).toContain("FROM beneficiaries");
    expect(sql).toContain("WHERE user_id = ?");
    expect(userId).toBe(5);

    // Le DAO doit renvoyer le même résultat que la DB mockée
    expect(res).toEqual([{ id: 1 }]);
  });

  test("findByIdAndUserId() appelle db.get avec id + userId", async () => {
    //  La DB renvoie un bénéficiaire précis
    db.get.mockResolvedValueOnce({ id: 3, user_id: 5 });

    const res = await BeneficiaryDAO.findByIdAndUserId(3, 5);

    expect(db.get).toHaveBeenCalledTimes(1);

    /**
     *  Vérifie que le DAO passe bien:
     * - la requête SQL
     * - l'id du beneficiary
     * - le userId (pour éviter d'accéder au beneficiary de quelqu’un d’autre)
     */
    const [sql, id, userId] = db.get.mock.calls[0];
    expect(sql).toContain("WHERE id = ? AND user_id = ?");
    expect(id).toBe(3);
    expect(userId).toBe(5);

    expect(res).toEqual({ id: 3, user_id: 5 });
  });

  test("create() appelle db.run avec bankName null si manquant", async () => {
    //  Simulation: après INSERT, SQLite renvoie lastID + changes
    db.run.mockResolvedValueOnce({ lastID: 10, changes: 1 });

    //  bankName est undefined, donc le DAO doit le convertir en null pour la DB
    const res = await BeneficiaryDAO.create({
      userId: 5,
      name: "Visa",
      accountNumber: "VISA-5-003",
      bankName: undefined,
    });

    expect(db.run).toHaveBeenCalledTimes(1);

    /**
     *  Vérifie les paramètres envoyés à la DB:
     * [sql, userId, name, accountNumber, bankName]
     *
     * C’est important car ça prouve que l’INSERT est correct + que null est géré.
     */
    const [sql, userId, name, accountNumber, bankName] = db.run.mock.calls[0];
    expect(sql).toContain("INSERT INTO beneficiaries");
    expect(userId).toBe(5);
    expect(name).toBe("Visa");
    expect(accountNumber).toBe("VISA-5-003");
    expect(bankName).toBeNull(); //  conversion undefined -> null attendue

    //  Le DAO renvoie la réponse DB (lastID, changes)
    expect(res).toEqual({ lastID: 10, changes: 1 });
  });
});