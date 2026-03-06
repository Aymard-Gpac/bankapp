/**
 * Service d'authentification
 * @module services/auth.service
 * @requires bcrypt
 * @requires jsonwebtoken
 * @requires ../models/user.model
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserDAO } from "../models/user.model.js";

/**
 * Service gérant l'authentification des utilisateurs
 * @namespace AuthService
 * @description Fournit toutes les fonctionnalités liées à l'authentification :
 * inscription, connexion, récupération du profil
 */
export const AuthService = {

  /**
   * Inscription d'un nouvel utilisateur
   * @async
   * @param {Object} data - Données d'inscription
   * @param {string} data.first_name - Prénom (obligatoire)
   * @param {string} data.last_name - Nom de famille (obligatoire)
   * @param {string} data.address - Adresse postale (obligatoire)
   * @param {string} data.city - Ville (obligatoire)
   * @param {string} data.state - Province/État (obligatoire)
   * @param {string} data.postal_code - Code postal (obligatoire)
   * @param {string} data.date_of_birth - Date de naissance (obligatoire)
   * @param {string} data.ssn - Numéro de sécurité sociale (obligatoire)
   * @param {string} data.email - Adresse courriel (obligatoire, unique)
   * @param {string} data.password - Mot de passe en clair (obligatoire)
   * @returns {Promise<Object>} Résultat de l'inscription
   * @returns {boolean} return.ok - Succès de l'opération
   * @returns {number} return.status - Code HTTP
   * @returns {Object} return.data - Données de l'utilisateur créé (si succès)
   * @returns {number} return.data.id - ID du nouvel utilisateur
   * @returns {string} return.data.email - Email de l'utilisateur
   * @returns {string} return.error - Message d'erreur (si échec)
   * @throws {Error} Propage les erreurs non gérées (DB, bcrypt)
   * 
   * @example
   * // Inscription réussie
   * const result = await AuthService.register({
   *   first_name: "Jean",
   *   last_name: "Dupont",
   *   address: "123 rue Principale",
   *   city: "Montréal",
   *   state: "QC",
   *   postal_code: "H1H 1H1",
   *   date_of_birth: "1990-01-01",
   *   ssn: "123-45-6789",
   *   email: "jean.dupont@email.com",
   *   password: "Password123!"
   * });
   * 
   * if (result.ok) {
   *   console.log(`Utilisateur créé: ${result.data.id}`);
   * } else {
   *   console.log(`Erreur ${result.status}: ${result.error}`);
   * }
   * 
   * @example
   * // Erreur: champ manquant
   * const result = await AuthService.register({
   *   email: "test@test.com"
   *   // autres champs manquants
   * });
   * // result = { ok: false, status: 400, error: "first_name is required" }
   */
  async register(data) {
    // Liste des champs obligatoires
    const required = [
      "first_name","last_name","address","city","state",
      "postal_code","date_of_birth","ssn","email","password"
    ];

    // Validation : vérifier que tous les champs requis sont présents
    for (const field of required) {
      if (!data[field]) {
        return { ok: false, status: 400, error: `${field} is required` };
      }
    }

    // Vérifier si l'email est déjà utilisé
    const exists = await UserDAO.findByEmail(data.email);
    if (exists) {
      return { ok: false, status: 409, error: "Email already exists" };
    }

    // Hacher le mot de passe (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Créer l'utilisateur avec le rôle "student" par défaut
    const result = await UserDAO.create({
      ...data,
      password: hashedPassword,
      role: "student"
    });

    // Retourner les informations de base (sans données sensibles)
    return {
      ok: true,
      status: 201,
      data: { id: result.lastID, email: data.email }
    };
  },

  /**
   * Connexion d'un utilisateur
   * @async
   * @param {Object} credentials - Identifiants de connexion
   * @param {string} credentials.email - Adresse courriel
   * @param {string} credentials.password - Mot de passe en clair
   * @returns {Promise<Object>} Résultat de la connexion
   * @returns {boolean} return.ok - Succès de l'opération
   * @returns {number} return.status - Code HTTP
   * @returns {Object} return.data - Données de connexion (si succès)
   * @returns {string} return.data.token - Token JWT d'authentification
   * @returns {Object} return.data.user - Informations utilisateur
   * @returns {number} return.data.user.id - ID de l'utilisateur
   * @returns {string} return.data.user.email - Email de l'utilisateur
   * @returns {string} return.data.user.role - Rôle de l'utilisateur
   * @returns {string} return.error - Message d'erreur (si échec)
   * @throws {Error} Propage les erreurs non gérées (DB, bcrypt, JWT)
   * 
   * @example
   * // Connexion réussie
   * const result = await AuthService.login({
   *   email: "jean.dupont@email.com",
   *   password: "Password123!"
   * });
   * 
   * if (result.ok) {
   *   // Stocker le token (localStorage, cookie, etc.)
   *   localStorage.setItem('token', result.data.token);
   *   console.log(`Connecté: ${result.data.user.email}`);
   * } else {
   *   console.log(`Erreur ${result.status}: ${result.error}`);
   * }
   * 
   * @example
   * // Erreur: identifiants invalides
   * const result = await AuthService.login({
   *   email: "wrong@email.com",
   *   password: "wrongpass"
   * });
   * // result = { ok: false, status: 401, error: "Invalid credentials" }
   * 
   * @note
   * Le token JWT expire après 2 heures et contient:
   * - id: ID de l'utilisateur
   * - role: Rôle pour les autorisations
   */
  async login({ email, password }) {
    // Validation des entrées
    if (!email || !password) {
      return { ok: false, status: 400, error: "Email and password required" };
    }

    // Rechercher l'utilisateur par email
    const user = await UserDAO.findByEmail(email);
    if (!user) {
      // Message générique pour ne pas donner d'indice
      return { ok: false, status: 401, error: "Invalid credentials" };
    }

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Message générique pour ne pas donner d'indice
      return { ok: false, status: 401, error: "Invalid credentials" };
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },      // Payload
      process.env.JWT_SECRET,                 // Clé secrète
      { expiresIn: "2h" }                     // Expiration
    );

    // Retourner le token et les infos de base
    return {
      ok: true,
      status: 200,
      data: {
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        }
      }
    };
  },

  /**
   * Récupère les informations de l'utilisateur connecté
   * @async
   * @param {number} userId - ID de l'utilisateur (extrait du token)
   * @returns {Promise<Object>} Résultat de la requête
   * @returns {boolean} return.ok - Succès de l'opération
   * @returns {number} return.status - Code HTTP
   * @returns {Object} return.data - Profil utilisateur (si succès)
   * @returns {string} return.error - Message d'erreur (si échec)
   * @throws {Error} Propage les erreurs non gérées (DB)
   * 
   * @example
   * // Récupérer le profil
   * const result = await AuthService.getCurrentUser(123);
   * 
   * if (result.ok) {
   *   console.log(`Profil:`, result.data);
   *   // Afficher: { id: 123, first_name: "Jean", email: "...", ... }
   * } else {
   *   console.log(`Erreur ${result.status}: ${result.error}`);
   * }
   * 
   * @example
   * // Utilisateur non trouvé
   * const result = await AuthService.getCurrentUser(999);
   * // result = { ok: false, status: 404, error: "User not found" }
   * 
   * @note
   * Le mot de passe est automatiquement retiré de la réponse
   * pour des raisons de sécurité.
   */
  async getCurrentUser(userId) {
    // Rechercher l'utilisateur par son ID
    const user = await UserDAO.findById(userId);
    if (!user) {
      return { ok: false, status: 404, error: "User not found" };
    }

    // Retirer le mot de passe des données retournées
    const { password, ...safe } = user;
    
    return { 
      ok: true, 
      status: 200, 
      data: safe 
    };
  }
};