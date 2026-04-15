/**
 * Routes bancaires
 * @module routes/bank.routes
 * @requires express
 * @requires ../controllers/bank.controller
 */

import express from "express";
import { BankController } from "../controllers/bank.controller.js";
import { authMiddleware, requireRoles } from "../middlewares/auth.middleware.js";

/**
 * Router Express pour les routes bancaires
 * @type {express.Router}
 * @namespace bankRouter
 * @description Définit tous les endpoints liés aux opérations bancaires
 * 
 * Base URL: /api/bank
 * Toutes ces routes nécessitent une authentification (middleware appliqué au niveau de l'app)
 */
const router = express.Router();
router.use(authMiddleware);
/**
 * Récupère tous les comptes d'un client
 * @name GET /api/bank/:clientId/accounts
 * @function
 * @memberof bankRouter
 * @param {string} path - Chemin de la route avec paramètre clientId
 * @param {Function} controller - Contrôleur pour la récupération des comptes
 * 
 * @example
 * // Requête
 * GET /api/bank/123/accounts
 * Authorization: Bearer <token> ou Cookie: token=...
 * 
 * // Réponse succès (200)
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "type": "cheque",
 *       "balance": 1000,
 *       "currency": "CAD",
 *       "account_number": "CHEQUE-123456-789"
 *     },
 *     {
 *       "id": 2,
 *       "type": "epargne", 
 *       "balance": 5000,
 *       "currency": "CAD",
 *       "account_number": "EPARGNE-123456-789"
 *     }
 *   ],
 *   "totalBanks": 2,
 *   "totalCurrentBalance": 6000
 * }
 * 
 * // Réponse erreur (400)
 * // GET /api/bank/invalid/accounts
 * {
 *   "error": "Invalid clientId"
 * }
 * 
 * // Réponse erreur (401) - non authentifié
 * {
 *   "error": "Authentication required"
 * }
 * 
 * @note
 * Paramètres:
 * - clientId: ID du client (dans l'URL)
 * 
 * Cette route est généralement protégée par un middleware d'authentification
 * appliqué au niveau du routeur parent ou de l'application.
 */
router.get("/:clientId/accounts", BankController.getClientAccounts);

/**
 * Récupère un compte spécifique d'un client avec ses transactions
 * @name GET /api/bank/:clientId/accounts/:accountId
 * @function
 * @memberof bankRouter
 * @param {string} path - Chemin de la route avec paramètres clientId et accountId
 * @param {Function} controller - Contrôleur pour la récupération du compte
 * 
 * @example
 * // Requête sans pagination (page par défaut = 1)
 * GET /api/bank/123/accounts/456
 * 
 * // Requête avec pagination
 * GET /api/bank/123/accounts/456?page=2
 * 
 * // Réponse succès (200)
 * {
 *   "account": {
 *     "id": 456,
 *     "type": "cheque",
 *     "balance": 1500,
 *     "currency": "CAD",
 *     "account_number": "CHEQUE-123456-789",
 *     "created_at": "2024-01-01T00:00:00Z"
 *   },
 *   "transactions": [
 *     {
 *       "id": 5,
 *       "amount": 100,
 *       "type": "deposit",
 *       "date": "2024-01-15T10:30:00Z"
 *     },
 *     {
 *       "id": 6,
 *       "amount": -50,
 *       "type": "withdrawal", 
 *       "date": "2024-01-16T14:20:00Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 2,
 *     "pageSize": 10,
 *     "total": 45,
 *     "totalPages": 5
 *   }
 * }
 * 
 * // Réponse erreur (400) - paramètres invalides
 * // GET /api/bank/abc/accounts/456
 * {
 *   "error": "Invalid parameters"
 * }
 * 
 * // Réponse erreur (404) - compte non trouvé
 * // GET /api/bank/123/accounts/999
 * {
 *   "error": "Account not found for this client"
 * }
 * 
 * @note
 * Paramètres:
 * - clientId: ID du client (dans l'URL, requis)
 * - accountId: ID du compte (dans l'URL, requis)
 * - page: (query) Numéro de page pour la pagination des transactions (défaut: 1)
 * 
 * La pagination utilise une taille de page par défaut de 10 transactions
 * (configurable dans le service BankService)
 */
router.get(
  "/:clientId/accounts/:accountId", 
  BankController.getClientAccount
);
router.get(
  "/:clientId/transactions/history",
  BankController.getClientTransactionHistory
);
router.patch(
  "/:clientId/accounts/:accountId/close",
  requireRoles("etudiant"),
  BankController.closeClientAccount
);

/**
 * Export du router configuré
 * @exports bankRouter
 */
export default router;