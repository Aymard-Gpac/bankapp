/**
 * Module d'accès aux données des comptes bancaires
 * @module models/bank.model
 * @requires ../config/database
 */

import db from "../config/database.js";

/**
 * DAO (Data Access Object) pour la gestion des comptes bancaires
 * @namespace AccountDAO
 * @description Fournit toutes les méthodes d'accès à la table 'accounts'
 */
export const AccountDAO = {
  /**
   * Crée un nouveau compte bancaire
   * @async
   * @param {Object} account - Données du compte à créer
   * @param {number} account.client_id - ID de l'utilisateur propriétaire du compte
   * @param {string} account.account_number - Numéro unique du compte (généré)
   * @param {string} account.type - Type de compte ("cheque" | "epargne" | "credit")
   * @param {number} [account.balance=0] - Solde initial du compte
   * @param {string} [account.currency="CAD"] - Devise du compte (défaut: CAD)
   * @returns {Promise<Object>} Résultat de l'insertion (contient lastID)
   * @throws {Error} Si la requête SQL échoue
   *
   * @example
   * // Créer un compte chèque
   * const result = await AccountDAO.create({
   *   client_id: 123,
   *   account_number: "CHEQUE-123456-789",
   *   type: "cheque",
   *   balance: 1000,
   *   currency: "CAD"
   * });
   * console.log(result.lastID); // ID du nouveau compte
   */
  create(a) {
    return db.run(
      `INSERT INTO accounts (user_id, account_number, type, balance, currency)
       VALUES (?, ?, ?, ?, ?)`,
      a.client_id,
      a.account_number,
      a.type, // "cheque" | "epargne" | "credit"
      a.balance ?? 0,
      a.currency ?? "CAD",
    );
  },

  /**
   * Récupère tous les comptes d'un client
   * @async
   * @param {number} clientId - ID du client
   * @returns {Promise<Array<Object>>} Liste des comptes du client
   * @returns {number} return[].id - ID du compte
   * @returns {number} return[].user_id - ID du propriétaire
   * @returns {string} return[].account_number - Numéro du compte
   * @returns {string} return[].type - Type de compte
   * @returns {number} return[].balance - Solde actuel
   * @returns {string} return[].currency - Devise
   * @returns {string} return[].created_at - Date de création
   * @throws {Error} Si la requête SQL échoue
   *
   * @example
   * // Récupérer tous les comptes du client 123
   * const accounts = await AccountDAO.findByClientId(123);
   * accounts.forEach(account => {
   *   console.log(`${account.type}: ${account.balance} ${account.currency}`);
   * });
   */
  findByClientId(clientId) {
    return db.all(
     `SELECT
        id,
        user_id,
        account_number,
        type,
        balance,
        currency,
        created_at,
        COALESCE(status, 'active') AS status,
        closed_at
      FROM accounts
      WHERE user_id = ?
        AND COALESCE(status, 'active') = 'active'
      ORDER BY id ASC`,
     clientId,
   );
  },

  /**
   * Calcule le résumé financier d'un client
   * @async
   * @param {number} clientId - ID du client
   * @returns {Promise<Object>} Résumé des comptes
   * @returns {number} return.totalBanks - Nombre total de comptes
   * @returns {number} return.totalCurrentBalance - Solde total cumulé
   * @throws {Error} Si la requête SQL échoue
   *
   * @example
   * // Obtenir le résumé financier du client 123
   * const summary = await AccountDAO.summaryByClientId(123);
   * console.log(`${summary.totalBanks} comptes, solde total: ${summary.totalCurrentBalance} CAD`);
   */
  summaryByClientId(clientId) {
    return db.get(
     `SELECT 
        COUNT(*) AS totalBanks,
        COALESCE(SUM(balance), 0) AS totalCurrentBalance
      FROM accounts
      WHERE user_id = ?
        AND COALESCE(status, 'active') = 'active'`,
      clientId,
    );
  },

  /**
   * Récupère un compte spécifique d'un client
   * @async
   * @param {number} accountId - ID du compte
   * @param {number} clientId - ID du client (pour vérification)
   * @returns {Promise<Object|null>} Le compte trouvé ou null
   * @returns {number} return.id - ID du compte
   * @returns {number} return.user_id - ID du propriétaire
   * @returns {string} return.account_number - Numéro du compte
   * @returns {string} return.type - Type de compte
   * @returns {number} return.balance - Solde actuel
   * @returns {string} return.currency - Devise
   * @returns {string} return.created_at - Date de création
   * @throws {Error} Si la requête SQL échoue
   *
   * @example
   * // Récupérer le compte #456 du client 123
   * const account = await AccountDAO.findByIdAndClientId(456, 123);
   * if (account) {
   *   console.log(`Compte ${account.account_number}: ${account.balance} ${account.currency}`);
   * } else {
   *   console.log("Compte non trouvé ou accès non autorisé");
   * }
   */
  findByIdAndClientId(accountId, clientId) {
    return db.get(
     `SELECT
        id,
        user_id,
        account_number,
        type,
        balance,
        currency,
        created_at,
        COALESCE(status, 'active') AS status,
        closed_at
      FROM accounts
      WHERE id = ?
        AND user_id = ?
        AND COALESCE(status, 'active') = 'active'`,
      accountId,
      clientId,
    ); 
  },
  // validation d'un compte(fermé ou actif) 
  findAnyByIdAndClientId(accountId, clientId) {
  return db.get(
    `SELECT
       id,
       user_id,
       account_number,
       type,
       balance,
       currency,
       created_at,
       COALESCE(status, 'active') AS status,
       closed_at
     FROM accounts
     WHERE id = ?
       AND user_id = ?`,
    accountId,
    clientId,
  );
},
// Ferme un compte bancaire (change son statut à 'closed')
closeAccount(accountId, clientId) {
  return db.run(
    `UPDATE accounts
     SET status = 'closed',
         closed_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND user_id = ?
       AND COALESCE(status, 'active') = 'active'`,
    accountId,
    clientId
  );
},

  updateBalance(accountId, newBalance) {
    return db.run(
      "UPDATE accounts SET balance = ? WHERE id = ?",
      newBalance,
      accountId,
    );
  },

  findCheckingByClientId(clientId) {
  return db.get(
    `SELECT
       id,
       user_id,
       account_number,
       type,
       balance,
       currency,
       created_at,
       COALESCE(status, 'active') AS status,
       closed_at
     FROM accounts
     WHERE user_id = ?
       AND COALESCE(status, 'active') = 'active'
       AND REPLACE(LOWER(TRIM(type)), 'é', 'e') LIKE '%cheque%'
     ORDER BY id ASC
     LIMIT 1`,
    clientId
  );
},
};
