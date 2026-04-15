/**
 * Service bancaire
 * @module services/bank.service
 * @requires ../models/bank.model
 * @requires ../models/transaction.model
 */

import { AccountDAO } from "../models/bank.model.js";
import { TransactionDAO } from "../models/transaction.model.js";
import { ScheduledTransactionDAO } from "../models/scheduled-transaction.model.js";

/**
 * Service gérant les opérations bancaires des clients
 * @namespace BankService
 * @description Fournit les fonctionnalités de consultation des comptes et transactions
 */
export const BankService = {
  /**
   * Récupère tous les comptes d'un client avec un résumé financier
   * @async
   * @param {number} clientId - ID du client
   * @returns {Promise<Object>} Liste des comptes et résumé
   * @returns {Array} return.data - Liste des comptes du client
   * @returns {number} return.totalBanks - Nombre total de comptes
   * @returns {number} return.totalCurrentBalance - Solde total cumulé
   * @throws {Error} Propage les erreurs des DAO
   * 
   * @example
   * // Récupérer les comptes du client 123
   * try {
   *   const result = await BankService.getClientAccounts(123);
   *   
   *   console.log(`Nombre de comptes: ${result.totalBanks}`);
   *   console.log(`Solde total: ${result.totalCurrentBalance} CAD`);
   *   
   *   result.data.forEach(account => {
   *     console.log(`${account.type}: ${account.balance} ${account.currency}`);
   *   });
   * } catch (error) {
   *   console.error("Erreur:", error.message);
   * }
   * 
   * @example
   * // Résultat typique
   * {
   *   data: [
   *     { id: 1, type: "cheque", balance: 1000, currency: "CAD", ... },
   *     { id: 2, type: "epargne", balance: 5000, currency: "CAD", ... },
   *     { id: 3, type: "credit", balance: -500, currency: "CAD", ... }
   *   ],
   *   totalBanks: 3,
   *   totalCurrentBalance: 5500
   * }
   */
  async getClientAccounts(clientId) {
    // Récupérer la liste des comptes
    const accounts = await AccountDAO.findByClientId(clientId);
    
    // Récupérer le résumé financier (total comptes + solde cumulé)
    const summary = await AccountDAO.summaryByClientId(clientId);

    return {
      data: accounts,
      totalBanks: summary.totalBanks,
      totalCurrentBalance: summary.totalCurrentBalance,
    };
  },

  /**
   * Récupère un compte spécifique d'un client avec ses transactions paginées
   * @async
   * @param {Object} params - Paramètres de la requête
   * @param {number} params.clientId - ID du client (pour vérification)
   * @param {number} params.accountId - ID du compte à consulter
   * @param {number} [params.page=1] - Numéro de page pour la pagination (défaut: 1)
   * @param {number} [params.pageSize=10] - Nombre de transactions par page (défaut: 10)
   * @returns {Promise<Object>} Détails du compte avec transactions paginées
   * @returns {Object} return.account - Informations du compte
   * @returns {Array} return.transactions - Liste des transactions de la page
   * @returns {Object} return.pagination - Métadonnées de pagination
   * @returns {number} return.pagination.page - Page actuelle
   * @returns {number} return.pagination.pageSize - Taille de page
   * @returns {number} return.pagination.total - Nombre total de transactions
   * @returns {number} return.pagination.totalPages - Nombre total de pages
   * @throws {Error} Lance une erreur 404 si le compte n'existe pas
   * @throws {Error} Propage les erreurs des DAO
   * 
   * @example
   * // Récupérer le compte #456 du client 123 (page 1, 10 transactions)
   * try {
   *   const result = await BankService.getClientAccount({
   *     clientId: 123,
   *     accountId: 456,
   *     page: 1,
   *     pageSize: 10
   *   });
   *   
   *   console.log(`Compte: ${result.account.type}`);
   *   console.log(`Solde: ${result.account.balance} ${result.account.currency}`);
   *   
   *   console.log(`Transactions (page ${result.pagination.page}/${result.pagination.totalPages}):`);
   *   result.transactions.forEach(tx => {
   *     console.log(`- ${tx.date}: ${tx.amount} (${tx.type})`);
   *   });
   *   
   *   console.log(`Total: ${result.pagination.total} transactions`);
   * } catch (error) {
   *   if (error.status === 404) {
   *     console.log("Compte non trouvé");
   *   } else {
   *     console.error("Erreur:", error);
   *   }
   * }
   * 
   * @example
   * // Récupérer la page 2 avec 5 transactions par page
   * const result = await BankService.getClientAccount({
   *   clientId: 123,
   *   accountId: 456,
   *   page: 2,
   *   pageSize: 5
   * });
   * 
   * @example
   * // Utilisation des valeurs par défaut (page=1, pageSize=10)
   * const result = await BankService.getClientAccount({
   *   clientId: 123,
   *   accountId: 456
   * });
   * 
   * @example
   * // Gestion d'erreur avec compte inexistant
   * try {
   *   await BankService.getClientAccount({
   *     clientId: 123,
   *     accountId: 999 // Compte qui n'existe pas
   *   });
   * } catch (error) {
   *   console.log(error.status); // 404
   *   console.log(error.message); // "Account not found for this client"
   * }
   */
  async getClientAccount({ clientId, accountId, page = 1, pageSize = 10 }) {
    // Vérifier que le compte existe et appartient bien au client
    const account = await AccountDAO.findByIdAndClientId(accountId, clientId);
    if (!account) {
      const err = new Error("Account not found for this client");
      err.status = 404; // Ajouter un code HTTP à l'erreur
      throw err;
    }

    // Calculer l'offset pour la pagination
    // Exemple: page 2 avec pageSize=10 → offset = (2-1)*10 = 10
    const offset = (page - 1) * pageSize;

    // Récupérer les transactions paginées
    const transactions = await TransactionDAO.findByAccountIdPaginated(
      accountId,
      pageSize,
      offset
    );

    // Récupérer le nombre total de transactions pour le compte
    const totalRow = await TransactionDAO.countByAccountId(accountId);

    // Retourner les données avec les métadonnées de pagination
    return {
      account,                          // Détails du compte
      transactions,                     // Transactions de la page courante
      pagination: {
        page,                           // Page actuelle
        pageSize,                       // Taille de page
        total: totalRow.total,          // Nombre total de transactions
        totalPages: Math.ceil(totalRow.total / pageSize), // Calcul du nombre de pages
      },
    };
  },
  // Récupère l'historique complet des transactions d'un client (tous comptes confondus)
  async getClientTransactionHistory(clientId) {
  return TransactionDAO.findHistoryByClientId(clientId);
},

// Ferme un compte bancaire d'un client après vérifications
async closeClientAccount({ clientId, accountId }) {
  const account = await AccountDAO.findAnyByIdAndClientId(accountId, clientId);

  if (!account) {
    const err = new Error("Account not found for this client");
    err.status = 404;
    throw err;
  }

  if (account.status === "closed") {
    const err = new Error("This account is already closed");
    err.status = 409;
    throw err;
  }

  const balance = Number(account.balance || 0);

  if (Math.abs(balance) > 0.00001) {
    const err = new Error(
      "Impossible de fermer ce compte : le solde doit être à 0"
    );
    err.status = 409;
    throw err;
  }

  const scheduledLinks =
    await ScheduledTransactionDAO.countActiveByAccountId(clientId, accountId);

  if (Number(scheduledLinks?.total || 0) > 0) {
    const err = new Error(
      "Impossible de fermer ce compte : des transactions programmées actives y sont encore liées"
    );
    err.status = 409;
    throw err;
  }

  const result = await AccountDAO.closeAccount(accountId, clientId);

  if (!result?.changes) {
    const err = new Error("Unable to close account");
    err.status = 500;
    throw err;
  }

  return {
    message: "Compte bancaire fermé avec succès",
    data: {
      accountId,
      status: "closed",
    },
  };
},
};