/**
 * DAO de gestion des virements bancaires
 * @module models/transfer.model
 * @requires ../config/database
 */

import db from "../config/database.js";

/**
 * TransferDAO
 * Couche d'accès aux données (DAO).
 * 
 * Responsabilités :
 * - Exécuter uniquement des requêtes SQL
 * - Ne contient aucune logique HTTP (req/res)
 * - Utilisé par les services pour enregistrer et récupérer les virements
 */
export const TransferDAO = {

  /**
   * Crée un nouveau virement entre deux comptes
   * @async
   * @function create
   * @param {Object} data - Données du virement
   * @param {number} data.fromAccountId - ID du compte source
   * @param {number} data.toAccountId - ID du compte destinataire
   * @param {number} data.amount - Montant transféré
   * @returns {Promise<Object>} Virement créé
   *
   * @example
   * const transfer = await TransferDAO.create({
   *   fromAccountId: 1,
   *   toAccountId: 2,
   *   amount: 100
   * });
   *
   * // Résultat
   * // {
   * //   id: 10,
   * //   from_account_id: 1,
   * //   to_account_id: 2,
   * //   amount: 100,
   * //   created_at: "2026-03-04T13:00:00Z"
   * // }
   */
  async create({ fromAccountId, toAccountId, amount, createdAt }) {
    const now = new Date();
    const safeCreatedAt =
      createdAt ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const r = await db.run(
      "INSERT INTO transfers (from_account_id, to_account_id, amount, created_at) VALUES (?, ?, ?, ?)",
      fromAccountId,
      toAccountId,
      amount,
      safeCreatedAt
    );

    // Retourne le virement nouvellement créé
    return db.get("SELECT * FROM transfers WHERE id = ?", r.lastID);
  },

  /**
   * Liste les virements liés à un compte (source ou destination)
   * avec pagination
   * @async
   * @function listByAccount
   * @param {number} accountId - ID du compte bancaire
   * @param {number} [limit=50] - Nombre maximum de résultats
   * @param {number} [offset=0] - Offset pour la pagination
   * @returns {Promise<Array<Object>>} Liste des virements
   *
   * @example
   * const transfers = await TransferDAO.listByAccount(1, 20, 0);
   *
   * // Résultat
   * // [
   * //   {
   * //     id: 5,
   * //     from_account_id: 1,
   * //     to_account_id: 3,
   * //     amount: 50,
   * //     created_at: "2026-03-04T12:00:00Z"
   * //   }
   * // ]
   */
  listByAccount(accountId, limit = 50, offset = 0) {
    return db.all(
      `SELECT * FROM transfers
       WHERE from_account_id = ? OR to_account_id = ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      accountId,
      accountId,
      limit,
      offset
    );
  },
};