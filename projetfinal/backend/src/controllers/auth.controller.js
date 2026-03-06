/**
 * Contrôleur d'authentification
 * @module controllers/auth.controller
 * @requires ../services/auth.service
 */

import { AuthService } from "../services/auth.service.js";

/**
 * Inscription d'un nouvel utilisateur
 * @async
 * @function register
 * @param {Object} req - Requête Express
 * @param {Object} req.body - Corps de la requête contenant les données d'inscription
 * @param {string} req.body.first_name - Prénom
 * @param {string} req.body.last_name - Nom
 * @param {string} req.body.address - Adresse
 * @param {string} req.body.city - Ville
 * @param {string} req.body.state - Province/État
 * @param {string} req.body.postal_code - Code postal
 * @param {string} req.body.date_of_birth - Date de naissance
 * @param {string} req.body.ssn - Numéro de sécurité sociale
 * @param {string} req.body.email - Adresse courriel
 * @param {string} req.body.password - Mot de passe
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP
 * 
 * @example
 * // Requête POST /api/auth/register
 * // Body: {
 * //   "first_name": "Jean",
 * //   "last_name": "Dupont",
 * //   "email": "jean@email.com",
 * //   "password": "Password123!",
 * //   ...autres champs
 * // }
 * 
 * // Réponse succès (201)
 * // {
 * //   "id": 123,
 * //   "email": "jean@email.com"
 * // }
 * 
 * // Réponse erreur (400)
 * // {
 * //   "error": "first_name is required"
 * // }
 */
export const register = async (req, res) => {
  const result = await AuthService.register(req.body);
  return res
    .status(result.status)
    .json(result.ok ? result.data : { error: result.error });
};

/**
 * Connexion d'un utilisateur
 * @async
 * @function login
 * @param {Object} req - Requête Express
 * @param {Object} req.body - Corps de la requête
 * @param {string} req.body.email - Adresse courriel
 * @param {string} req.body.password - Mot de passe
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP avec cookie HTTP-only
 * 
 * @example
 * // Requête POST /api/auth/login
 * // Body: {
 * //   "email": "jean@email.com",
 * //   "password": "Password123!"
 * // }
 * 
 * // Réponse succès (200)
 * // {
 * //   "token": "eyJhbGciOiJIUzI1NiIs...",
 * //   "user": {
 * //     "id": 123,
 * //     "email": "jean@email.com",
 * //     "role": "student"
 * //   }
 * // }
 * // + Cookie HTTP-only "token" automatiquement défini
 * 
 * // Réponse erreur (401)
 * // {
 * //   "error": "Invalid credentials"
 * // }
 * 
 * @note
 * Le token JWT est stocké dans un cookie HTTP-only pour plus de sécurité :
 * - httpOnly: true → inaccessible via JavaScript (protection XSS)
 * - sameSite: "lax" → protection contre CSRF
 * - maxAge: 2h → expiration après 2 heures
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.login({ email, password });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  const { token, user } = result.data;

  // Définir le cookie HTTP-only avec le token JWT
  res.cookie("token", token, {
    httpOnly: true,           // Empêche l'accès par JavaScript
    sameSite: "lax",          // Protection contre les attaques CSRF
    secure: false,            // À mettre à true en production avec HTTPS
    maxAge: 2 * 60 * 60 * 1000, // 2 heures en millisecondes
    path: "/",                // Cookie valide pour tout le site
  });

  // Retourner aussi le token dans la réponse pour les clients qui ne gèrent pas les cookies
  return res.status(200).json({ token, user }); 
};

/**
 * Déconnexion d'un utilisateur
 * @async
 * @function logout
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP avec cookie effacé
 * 
 * @example
 * // Requête POST /api/auth/logout
 * 
 * // Réponse succès (200)
 * // {
 * //   "ok": true
 * // }
 * 
 * @note
 * Supprime le cookie "token" côté client
 */
export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
  return res.status(200).json({ ok: true });
};

/**
 * Récupère les informations de l'utilisateur connecté
 * @async
 * @function getMe
 * @param {Object} req - Requête Express
 * @param {Object} req.user - Utilisateur authentifié (ajouté par le middleware)
 * @param {number} req.user.id - ID de l'utilisateur
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP avec les données utilisateur
 * 
 * @example
 * // Requête GET /api/auth/me
 * // Headers: { Cookie: "token=..." } ou Authorization: "Bearer ..."
 * 
 * // Réponse succès (200)
 * // {
 * //   "id": 123,
 * //   "first_name": "Jean",
 * //   "last_name": "Dupont",
 * //   "email": "jean@email.com",
 * //   "role": "student",
 * //   "address": "...",
 * //   ...autres champs (sans le mot de passe)
 * // }
 * 
 * // Réponse erreur (401)
 * // {
 * //   "error": "User not found"
 * // }
 * 
 * @note
 * Nécessite d'être authentifié (middleware auth)
 */
export const getMe = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Not authenticated (req.user missing)" });
  }

  const r = await AuthService.getCurrentUser(req.user.id);
  return res.status(r.status).json(r.ok ? r.data : { error: r.error });
};