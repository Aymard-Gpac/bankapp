import { jest, describe, test, expect, beforeEach } from "@jest/globals";

/**
 * On mock le DAO pour ne pas toucher la DB.
 * Le but: tester uniquement la logique du service.
 */
jest.unstable_mockModule("../../src/models/beneficiary.model.js", () => ({
  BeneficiaryDAO: {
    listByUserId: jest.fn(),
  },
}));

const { BeneficiaryService } = await import("../../src/services/beneficiary.service.js");
const { BeneficiaryDAO } = await import("../../src/models/beneficiary.model.js");

describe("BeneficiaryService.list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("retourne la liste des bénéficiaires (200)", async () => {
    // Simule le résultat DB
    BeneficiaryDAO.listByUserId.mockResolvedValueOnce([
      { id: 1, user_id: 10, name: "Hydro", account_number: "HQ-10", bank_name: "HQ" },
    ]);

    const res = await BeneficiaryService.list(10);

    expect(BeneficiaryDAO.listByUserId).toHaveBeenCalledTimes(1);
    expect(BeneficiaryDAO.listByUserId).toHaveBeenCalledWith(10);

    expect(res).toEqual({
      ok: true,
      status: 200,
      data: [{ id: 1, user_id: 10, name: "Hydro", account_number: "HQ-10", bank_name: "HQ" }],
    });
  });

  test("propage l'erreur si le DAO plante (utile pour coverage + robustesse)", async () => {
    // Ici le service n'a pas de try/catch -> il va throw
    BeneficiaryDAO.listByUserId.mockRejectedValueOnce(new Error("DB down"));

    await expect(BeneficiaryService.list(10)).rejects.toThrow("DB down");
  });
});