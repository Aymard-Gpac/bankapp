/**
 * DAO de gestion des transactions bancaires
 * @module models/transaction.model
 * @requires ../config/database
 */

import db from "../config/database.js";

/**
 * TransactionDAO
 * Couche d'accès auxx données (DAO).
 * 
 * Responsabilités :
 * - Exécuter uniquement des requêtes SQL
 * - Ne contient aucune logique HTTP (req/res)
 * - Utilisé par les services pour lire ou écrire des transactions
 */
export const TransactionDAO = {

  /**
   * Récupère les transactions d'un compte avec pagination
   * @async
   * @function findByAccountIdPaginated
   * @param {number} accountId - ID du compte bancaire
   * @param {number} limit - Nombre maximum de transactions à récupérer
   * @param {number} offset - Décalage pour la pagination
   * @returns {Promise<Array<Object>>} Liste des transactions
   *
   * @example
   * const transactions = await TransactionDAO.findByAccountIdPaginated(1, 10, 0);
   *
   * // Résultat
   * // [
   * //   {
   * //     id: 1,
   * //     account_id: 1,
   * //     description: "Paiement facture à Hydro Québec",
   * //     amount: -45,
   * //     type: "DEBIT",
   * //     created_at: "2026-03-04T12:00:00Z"
   * //   }
   * // ]
   */
  findByAccountIdPaginated(accountId, limit, offset) {
    return db.all(
      `SELECT id, account_id, description, amount, type, created_at
       FROM transactions
       WHERE account_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      accountId,
      limit,
      offset
    );
  },

  /**
   * Compte le nombre total de transactions pour un compte
   * (utile pour la pagination côté frontend)
   * @async
   * @function countByAccountId
   * @param {number} accountId - ID du compte bancaire
   * @returns {Promise<Object>} Nombre total de transactions
   *
   * @example
   * const result = await TransactionDAO.countByAccountId(1);
   *
   * // Résultat
   * // { total: 25 }
   */
  countByAccountId(accountId) {
    return db.get(
      `SELECT COUNT(*) AS total
       FROM transactions
       WHERE account_id = ?`,
      accountId
    );
  },

  /**
   * Crée une nouvelle transaction bancaire
   * @async
   * @function create
   * @param {Object} data - Données de la transaction
   * @param {number} data.accountId - ID du compte concerné
   * @param {string} data.type - Type de transaction (DEBIT ou CREDIT)
   * @param {number} data.amount - Montant de la transaction
   * @param {string} [data.description] - Description optionnelle
   * @returns {Promise<Object>} Transaction créée
   *
   * @example
   * const transaction = await TransactionDAO.create({
   *   accountId: 1,
   *   type: "DEBIT",
   *   amount: 50,
   *   description: "Paiement facture Bell Internet"
   * });
   *
   * // Résultat
   * // {
   * //   id: 10,
   * //   account_id: 1,
   * //   type: "DEBIT",
   * //   amount: 50,
   * //   description: "Paiement facture Bell Internet",
   * //   created_at: "2026-03-04T12:10:00Z"
   * // }
   */
  async create({ accountId, type, amount, description, createdAt }) {
    // Si aucune date n’est fournie, on garde la date courante
    const now = new Date();
    const safeCreatedAt =
      createdAt ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    // Insertion de la transaction dans la base
    const r = await db.run(
      "INSERT INTO transactions (account_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)",
      accountId,
      type,
      amount,
      description ?? null,
      safeCreatedAt
    );

    // Récupération de la transaction créée
    return db.get("SELECT * FROM transactions WHERE id = ?", r.lastID);
  },
// Récupère l'historique de transactions d'un client (toutes les transactions de tous ses comptes)
  findHistoryByClientId(clientId) {
  return db.all(
    `SELECT
       t.id,
       t.account_id,
       a.type AS account_type,
       a.account_number,
       t.description,
       t.amount,
       t.type,
       t.created_at
     FROM transactions t
     INNER JOIN accounts a ON a.id = t.account_id
     WHERE a.user_id = ?
     ORDER BY t.created_at DESC, t.id DESC`,
    clientId
  );
},

};