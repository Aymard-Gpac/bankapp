/**
 * Routes de gestion des clients
 * @module routes/client.routes
 * @requires express
 * @requires ../middlewares/auth.middleware
 * @requires ../controllers/client.controller
 */

import express from "express";
import { authMiddleware, requireRoles } from "../middlewares/auth.middleware.js";
import {
  createClient, listClients, getClient, updateClient, deleteClient,
  getCurrentClient
} from "../controllers/client.controller.js";

/**
 * Router Express pour les routes clients
 * @type {express.Router}
 * @namespace clientRouter
 * @description Définit tous les endpoints liés à la gestion des clients
 * 
 * Base URL: /api/clients
 * Toutes ces routes nécessitent une authentification (authMiddleware)
 */
const router = express.Router();

/**
 * Middleware d'authentification appliqué à toutes les routes
 * @middleware
 * Vérifie que l'utilisateur est connecté avant d'accéder à une route client
 */
router.use(authMiddleware);

/**
 * Récupère le profil du client connecté
 * @name GET /api/clients/me/:clientId
 * @function
 * @memberof clientRouter
 * @param {string} path - Chemin de la route
 * @param {Function} middleware - Middleware de vérification des rôles
 * @param {Function} controller - Contrôleur pour le profil courant
 * 
 * @example
 * // Requête
 * GET /api/clients/me/123
 * 
 * // Réponse succès (200)
 * {
 *   "id": 123,
 *   "first_name": "Jean",
 *   "last_name": "Dupont",
 *   "email": "jean@email.com",
 *   "role": "client",
 *   "address": "123 rue Principale",
 *   "city": "Montréal",
 *   "state": "QC",
 *   "postal_code": "H1H 1H1"
 * }
 * 
 * // Réponse erreur (403)
 * {
 *   "error": "Access denied. Required roles: student, etudiant, admin"
 * }
 * 
 * @note
 * Rôles autorisés: student, etudiant, admin
 * Le clientId dans l'URL doit correspondre à l'ID de l'utilisateur connecté
 */
router.get(
  "/me/:clientId",
  requireRoles("etudiant", "client"),
  getCurrentClient
);

/**
 * Crée un nouveau client (avec comptes bancaires par défaut)
 * @name POST /api/clients
 * @function
 * @memberof clientRouter
 * @param {string} path - Chemin de la route
 * @param {Function} middleware - Middleware de vérification des rôles
 * @param {Function} controller - Contrôleur de création
 * 
 * @example
 * // Requête
 * POST /api/clients
 * {
 *   "first_name": "Marie",
 *   "last_name": "Lambert",
 *   "email": "marie@email.com",
 *   "address": "456 rue de l'Université",
 *   "city": "Québec",
 *   "state": "QC",
 *   "postal_code": "G1V 0A6"
 * }
 * 
 * // Réponse succès (201)
 * {
 *   "userId": 124,
 *   "message": "Client created + 3 accounts created"
 * }
 * 
 * @note
 * Rôle requis: etudiant
 */
router.post("/", requireRoles("etudiant"), createClient);

/**
 * Liste tous les clients (avec pagination)
 * @name GET /api/clients
 * @function
 * @memberof clientRouter
 * @param {string} path - Chemin de la route
 * @param {Function} middleware - Middleware de vérification des rôles
 * @param {Function} controller - Contrôleur de liste
 * 
 * @example
 * // Requête
 * GET /api/clients?limit=20&offset=40
 * 
 * // Réponse succès (200)
 * [
 *   { "id": 123, "first_name": "Jean", "last_name": "Dupont", "email": "jean@email.com" },
 *   { "id": 124, "first_name": "Marie", "last_name": "Lambert", "email": "marie@email.com" }
 * ]
 * 
 * @note
 * Rôle requis: etudiant
 * Supporte la pagination via query parameters: limit, offset
 */
router.get("/", requireRoles("etudiant", "client"), listClients);

/**
 * Récupère un client spécifique par son ID
 * @name GET /api/clients/:id
 * @function
 * @memberof clientRouter
 * @param {string} path - Chemin de la route avec paramètre id
 * @param {Function} middleware - Middleware de vérification des rôles
 * @param {Function} controller - Contrôleur de récupération
 * 
 * @example
 * // Requête
 * GET /api/clients/123
 * 
 * // Réponse succès (200)
 * {
 *   "id": 123,
 *   "first_name": "Jean",
 *   "last_name": "Dupont",
 *   "email": "jean@email.com",
 *   "address": "123 rue Principale",
 *   "city": "Montréal",
 *   "state": "QC",
 *   "postal_code": "H1H 1H1",
 *   "date_of_birth": "1990-01-01",
 *   "created_at": "2024-01-01T00:00:00Z"
 * }
 * 
 * // Réponse erreur (404)
 * {
 *   "error": "Client not found"
 * }
 * 
 * @note
 * Rôle requis: etudiant
 */
router.get("/:id", requireRoles("etudiant", "client"), getClient);

/**
 * Met à jour un client existant
 * @name PUT /api/clients/:id
 * @function
 * @memberof clientRouter
 * @param {string} path - Chemin de la route avec paramètre id
 * @param {Function} middleware - Middleware de vérification des rôles
 * @param {Function} controller - Contrôleur de mise à jour
 * 
 * @example
 * // Requête
 * PUT /api/clients/123
 * {
 *   "first_name": "Jean-Pierre",
 *   "address": "456 Nouvelle Rue"
 * }
 * 
 * // Réponse succès (200)
 * {
 *   "message": "Updated"
 * }
 * 
 * // Réponse erreur (409)
 * {
 *   "error": "Email already used"
 * }
 * 
 * @note
 * Rôle requis: etudiant
 * La mise à jour peut être partielle (seulement les champs fournis)
 */
router.put("/:id", requireRoles("etudiant"), updateClient);

/**
 * Supprime un client
 * @name DELETE /api/clients/:id
 * @function
 * @memberof clientRouter
 * @param {string} path - Chemin de la route avec paramètre id
 * @param {Function} middleware - Middleware de vérification des rôles
 * @param {Function} controller - Contrôleur de suppression
 * 
 * @example
 * // Requête
 * DELETE /api/clients/123
 * 
 * // Réponse succès (200)
 * {
 *   "message": "Deleted"
 * }
 * 
 * // Réponse erreur (404)
 * {
 *   "error": "Client not found"
 * }
 * 
 * @note
 * Rôle requis: etudiant
 * Attention: La suppression peut échouer si le client a des comptes associés
 */
router.delete("/:id", requireRoles("etudiant"), deleteClient);

// Note: Il y a une duplication de la route "/me/:clientId"
// La première définition (ligne 22) est celle qui sera utilisée
// La seconde (ligne 42) est redondante et peut être supprimée

/**
 * Export du router configuré
 * @exports clientRouter
 */
export default router;