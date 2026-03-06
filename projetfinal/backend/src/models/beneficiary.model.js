/**
 * DAO de gestion des bénéficiaires
 * @module models/beneficiary.model
 * @requires ../config/database
 */

import db from "../config/database.js";

/**
 * BeneficiaryDAO
 * Couche d'accès aux données (DAO).
 * 
 * Responsabilités :
 * - Exécuter uniquement des requêtes SQL
 * - Ne contient aucune logique HTTP (req/res)
 * - Utilisé par  les services pour interagir avec la base de données
 */
export const BeneficiaryDAO = {

  /**
   * Liste tous les bénéficiaires appartenant à un utilisateur
   * @async
   * @function listByUserId
   * @param {number} userId - ID de l'utilisateur propriétaire des bénéficiaires
   * @returns {Promise<Array<Object>>} Liste des bénéficiaires
   *
   * @example
   * // Appel depuis un service
   * const beneficiaries = await BeneficiaryDAO.listByUserId(5);
   *
   * // Résultat
   * // [
   * //   {
   * //     id: 1,
   * //     user_id: 5,
   * //     name: "Hydro Québec",
   * //     account_number: "HQ-5-001",
   * //     bank_name: "Hydro Bank",
   * //     created_at: "2026-03-04T10:00:00Z"
   * //   }
   * // ]
   */
  listByUserId(userId) {
    return db.all(
      `SELECT id, user_id, name, account_number, bank_name, created_at
       FROM beneficiaries
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      userId
    );
  },

  /**
   * Recherche un bénéficiaire spécifique appartenant à un utilisateur
   * @async
   * @function findByIdAndUserId
   * @param {number} id - ID du bénéficiaire
   * @param {number} userId - ID de l'utilisateur propriétaire
   * @returns {Promise<Object|null>} Bénéficiaire trouvé ou null
   *
   * @example
   * const beneficiary = await BeneficiaryDAO.findByIdAndUserId(3, 5);
   *
   * // Résultat
   * // {
   * //   id: 3,
   * //   user_id: 5,
   * //   name: "Bell Internet",
   * //   account_number: "BELL-5-002",
   * //   bank_name: "Bell Bank",
   * //   created_at: "2026-03-04T10:00:00Z"
   * // }
   */
  findByIdAndUserId(id, userId) {
    return db.get(
      `SELECT id, user_id, name, account_number, bank_name, created_at
       FROM beneficiaries
       WHERE id = ? AND user_id = ?`,
      id,
      userId
    );
  },

  /**
   * Crée un nouveau bénéficiaire pour un utilisateur
   * @async
   * @function create
   * @param {Object} data - Données du bénéficiaire
   * @param {number} data.userId - ID de l'utilisateur propriétaire
   * @param {string} data.name - Nom du bénéficiaire (ex: Hydro Québec)
   * @param {string} data.accountNumber - Numéro de compte du bénéficiaire
   * @param {string} [data.bankName] - Nom de la banque (optionnel)
   * @returns {Promise<Object>} Résultat de l'insertion SQL
   *
   * @example
   * await BeneficiaryDAO.create({
   *   userId: 5,
   *   name: "Visa Credit Card",
   *   accountNumber: "VISA-5-003",
   *   bankName: "Visa"
   * });
   *
   * // Résultat
   * // {
   * //   lastID: 10,
   * //   changes: 1
   * // }
   */
  create({ userId, name, accountNumber, bankName }) {
    return db.run(
      `INSERT INTO beneficiaries (user_id, name, account_number, bank_name)
       VALUES (?, ?, ?, ?)`,
      userId,
      name,
      accountNumber,
      bankName ?? null
    );
  },
};