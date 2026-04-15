/**
 * Contrôleur bancaire
 * @module controllers/bank.controller
 * @requires ../services/bank.service
 */

import { BankService } from "../services/bank.service.js";

/**
 * Contrôleur gérant les routes bancaires
 * @namespace BankController
 * @description Fournit les endpoints pour la consultation des comptes et transactions
 */
export const BankController = {
  /**
   * Récupère tous les comptes d'un client avec leur résumé
   * @async
   * @function getClientAccounts
   * @param {Object} req - Requête Express
   * @param {Object} req.params - Paramètres de route
   * @param {string} req.params.clientId - ID du client (dans l'URL)
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant (gestion d'erreurs)
   * @returns {Promise<Object>} Réponse HTTP
   * 
   * @example
   * // Requête GET /api/bank/clients/123/accounts
   * 
   * // Réponse succès (200)
   * // {
   * //   "data": [
   * //     { "id": 1, "type": "cheque", "balance": 1000, "currency": "CAD" },
   * //     { "id": 2, "type": "epargne", "balance": 5000, "currency": "CAD" },
   * //     { "id": 3, "type": "credit", "balance": -500, "currency": "CAD" }
   * //   ],
   * //   "totalBanks": 3,
   * //   "totalCurrentBalance": 5500
   * // }
   * 
   * // Réponse erreur (400)
   * // {
   * //   "error": "Invalid clientId"
   * // }
   * 
   * @throws {Error} Erreurs propagées au middleware d'erreur
   */
  async getClientAccounts(req, res, next) {
    try {
      // Validation et conversion du paramètre clientId
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ error: "Invalid clientId" });
      }
       //  Sécurité client
      if (req.user?.role === "client" && req.user.id !== clientId) {
      return res.status(403).json({ error: "Forbidden" });
      }

      // Appel au service bancaire
      const result = await BankService.getClientAccounts(clientId);
      
      // Retourner les résultats
      res.json(result);
    } catch (err) {
      // Passer l'erreur au middleware de gestion d'erreurs
      next(err);
    }
  },

  /**
   * Récupère un compte spécifique d'un client avec ses transactions paginées
   * @async
   * @function getClientAccount
   * @param {Object} req - Requête Express
   * @param {Object} req.params - Paramètres de route
   * @param {string} req.params.clientId - ID du client
   * @param {string} req.params.accountId - ID du compte
   * @param {Object} req.query - Paramètres de requête
   * @param {string} [req.query.page=1] - Numéro de page pour la pagination
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant (gestion d'erreurs)
   * @returns {Promise<Object>} Réponse HTTP
   * 
   * @example
   * // Requête GET /api/bank/clients/123/accounts/456?page=2
   * 
   * // Réponse succès (200)
   * // {
   * //   "account": {
   * //     "id": 456,
   * //     "type": "cheque",
   * //     "balance": 1500,
   * //     "currency": "CAD",
   * //     "account_number": "CHEQUE-123456-789"
   * //   },
   * //   "transactions": [
   * //     { "id": 5, "amount": 100, "type": "deposit", "date": "2024-01-15" },
   * //     { "id": 6, "amount": -50, "type": "withdrawal", "date": "2024-01-16" }
   * //   ],
   * //   "pagination": {
   * //     "page": 2,
   * //     "pageSize": 10,
   * //     "total": 45,
   * //     "totalPages": 5
   * //   }
   * // }
   * 
   * // Réponse erreur (400)
   * // {
   * //   "error": "Invalid parameters"
   * // }
   * 
   * // Réponse erreur (404) - via le service
   * // {
   * //   "error": "Account not found for this client"
   * // }
   * 
   * @throws {Error} Erreurs propagées au middleware d'erreur
   */
  async getClientAccount(req, res, next) {
    try {
      // Validation et conversion des paramètres
      const clientId = Number(req.params.clientId);
      const accountId = Number(req.params.accountId);
      const page = Number(req.query.page) || 1;

      // Vérifier que les IDs sont valides
      if (isNaN(clientId) || isNaN(accountId)) {
        return res.status(400).json({ error: "Invalid parameters" });
      }
      //  Sécurité client
      if (req.user?.role === "client" && req.user.id !== clientId) {
      return res.status(403).json({ error: "Forbidden" });
      }

      // Appel au service bancaire
      const result = await BankService.getClientAccount({
        clientId,
        accountId,
        page,
        // pageSize non spécifié → utilise la valeur par défaut (10)
      });

      // Retourner les résultats
      res.json(result);
    } catch (err) {
      // Passer l'erreur au middleware de gestion d'erreurs
      // Les erreurs 404 du service seront catchées ici
      next(err);
    }
  },
  // Récupère l'historique complet des transactions d'un client (tous comptes confondus)
  async getClientTransactionHistory(req, res, next) {
  try {
    const clientId = Number(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid clientId" });
    }

    if (req.user?.role === "client" && req.user.id !== clientId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await BankService.getClientTransactionHistory(clientId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
},
// Ferme un compte bancaire d'un client
async closeClientAccount(req, res, next) {
  try {
    const clientId = Number(req.params.clientId);
    const accountId = Number(req.params.accountId);

    if (isNaN(clientId) || isNaN(accountId)) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const result = await BankService.closeClientAccount({
      clientId,
      accountId,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
},
};