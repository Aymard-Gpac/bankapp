/**
 * Routes d'authentification
 * @module routes/auth.routes
 * @requires express
 * @requires ../controllers/auth.controller
 * @requires ../middlewares/auth.middleware
 */

import express from "express";
import { register, login, getMe, logout } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

/**
 * Router Express pour les routes d'authentification
 * @type {express.Router}
 * @namespace authRouter
 * @description Définit tous les endpoints liés à l'authentification
 * 
 * Base URL: /api/auth
 */
const router = express.Router();

/**
 * Route d'inscription
 * @name POST /api/auth/register
 * @function
 * @memberof authRouter
 * @param {string} path - Chemin de la route
 * @param {Function} controller - Contrôleur d'inscription
 * 
 * @example
 * // Requête
 * POST /api/auth/register
 * {
 *   "first_name": "Jean",
 *   "last_name": "Dupont",
 *   "email": "jean@email.com",
 *   "password": "Password123!",
 *   "address": "123 rue Principale",
 *   "city": "Montréal",
 *   "state": "QC",
 *   "postal_code": "H1H 1H1",
 *   "date_of_birth": "1990-01-01",
 *   "ssn": "123-45-6789"
 * }
 * 
 * // Réponse succès (201)
 * {
 *   "id": 123,
 *   "email": "jean@email.com"
 * }
 * 
 * // Réponse erreur (400)
 * {
 *   "error": "first_name is required"
 * }
 */
router.post("/register", register);

/**
 * Route de connexion
 * @name POST /api/auth/login
 * @function
 * @memberof authRouter
 * @param {string} path - Chemin de la route
 * @param {Function} controller - Contrôleur de connexion
 * 
 * @example
 * // Requête
 * POST /api/auth/login
 * {
 *   "email": "jean@email.com",
 *   "password": "Password123!"
 * }
 * 
 * // Réponse succès (200)
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": 123,
 *     "email": "jean@email.com",
 *     "role": "student"
 *   }
 * }
 * // + Cookie HTTP-only "token"
 * 
 * // Réponse erreur (401)
 * {
 *   "error": "Invalid credentials"
 * }
 */
router.post("/login", login);

/**
 * Route de déconnexion
 * @name POST /api/auth/logout
 * @function
 * @memberof authRouter
 * @param {string} path - Chemin de la route
 * @param {Function} controller - Contrôleur de déconnexion
 * 
 * @example
 * // Requête
 * POST /api/auth/logout
 * 
 * // Réponse succès (200)
 * {
 *   "ok": true
 * }
 * // + Cookie "token" effacé
 */
router.post("/logout", logout);

/**
 * Route du profil utilisateur connecté
 * @name GET /api/auth/me
 * @function
 * @memberof authRouter
 * @param {string} path - Chemin de la route
 * @param {Function} middleware - Middleware d'authentification
 * @param {Function} controller - Contrôleur de profil
 * 
 * @example
 * // Requête
 * GET /api/auth/me
 * Cookie: token=eyJhbGciOiJIUzI1NiIs...
 * 
 * // Réponse succès (200)
 * {
 *   "id": 123,
 *   "first_name": "Jean",
 *   "last_name": "Dupont",
 *   "email": "jean@email.com",
 *   "role": "student",
 *   "address": "123 rue Principale",
 *   "city": "Montréal",
 *   "state": "QC",
 *   "postal_code": "H1H 1H1",
 *   "date_of_birth": "1990-01-01",
 *   "created_at": "2024-01-01T00:00:00Z"
 * }
 * 
 * // Réponse erreur (401)
 * {
 *   "error": "Authentication required"
 * }
 * 
 * @note
 * Cette route est protégée par le middleware authMiddleware
 * qui vérifie la présence et la validité du token JWT
 * (dans le cookie ou le header Authorization)
 */
router.get("/me", authMiddleware, getMe);

/**
 * Export du router configuré
 * @exports authRouter
 */
export default router;