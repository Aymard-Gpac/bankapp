/**
 * Module d'accès aux données des clients
 * @module models/client.model
 * @requires ../config/database
 */

import db from "../config/database.js";

/**
 * DAO (Data Access Object) pour la gestion des clients
 * @namespace ClientDAO
 * @description Fournit toutes les méthodes d'accès à la table 'users' pour les clients (role = 'client')
 * Toutes les méthodes filtrent automatiquement par rôle pour ne retourner que des clients
 */
export const ClientDAO = {
  /**
   * Récupère la liste paginée de tous les clients
   * @async
   * @param {number} [limit=50] - Nombre maximum de résultats à retourner (défaut: 50)
   * @param {number} [offset=0] - Nombre de résultats à sauter pour la pagination (défaut: 0)
   * @returns {Promise<Array<Object>>} Liste des clients
   * @returns {number} return[].id - ID unique du client
   * @returns {string} return[].first_name - Prénom
   * @returns {string} return[].last_name - Nom de famille
   * @returns {string} return[].address - Adresse postale
   * @returns {string} return[].city - Ville
   * @returns {string} return[].state - Province/État
   * @returns {string} return[].postal_code - Code postal
   * @returns {string} return[].date_of_birth - Date de naissance (YYYY-MM-DD)
   * @returns {string} return[].ssn - Numéro de sécurité sociale (NAS)
   * @returns {string} return[].email - Adresse courriel
   * @returns {string} return[].role - Rôle (toujours 'client')
   * @returns {string} return[].created_at - Date de création du compte
   * @throws {Error} Si la requête SQL échoue
   * 
   * @example
   * // Récupérer les 10 premiers clients
   * const clients = await ClientDAO.findAll(10, 0);
   * 
   * @example
   * // Pagination: page 2 avec 20 clients par page
   * const page2 = await ClientDAO.findAll(20, 20);
   */
  findAll(limit = 50, offset = 0) {
    return db.all(
      `SELECT id, first_name, last_name, address, city, state, postal_code, date_of_birth, ssn, email, role, created_at
       FROM users
       WHERE role = 'client'
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      limit,
      offset
    );
  },

  /**
   * Récupère un client par son ID
   * @async
   * @param {number} id - ID du client à rechercher
   * @returns {Promise<Object|null>} Le client trouvé ou null si inexistant
   * @returns {number} return.id - ID unique du client
   * @returns {string} return.first_name - Prénom
   * @returns {string} return.last_name - Nom de famille
   * @returns {string} return.address - Adresse postale
   * @returns {string} return.city - Ville
   * @returns {string} return.state - Province/État
   * @returns {string} return.postal_code - Code postal
   * @returns {string} return.date_of_birth - Date de naissance
   * @returns {string} return.ssn - Numéro de sécurité sociale
   * @returns {string} return.email - Adresse courriel
   * @returns {string} return.role - Rôle (toujours 'client')
   * @returns {string} return.created_at - Date de création
   * @throws {Error} Si la requête SQL échoue
   * 
   * @example
   * // Récupérer le client avec l'ID 123
   * const client = await ClientDAO.findById(123);
   * if (client) {
   *   console.log(`${client.first_name} ${client.last_name}`);
   * } else {
   *   console.log("Client non trouvé");
   * }
   */
  findById(id) {
    return db.get(
      `SELECT id, first_name, last_name, address, city, state, postal_code, date_of_birth, ssn, email, role, created_at
       FROM users
       WHERE id = ? AND role = 'client'`,
      id
    );
  },

  /**
   * Crée un nouveau client
   * @async
   * @param {Object} user - Données du client à créer
   * @param {string} user.first_name - Prénom (obligatoire)
   * @param {string} user.last_name - Nom de famille (obligatoire)
   * @param {string} user.address - Adresse postale (obligatoire)
   * @param {string} user.city - Ville (obligatoire)
   * @param {string} user.state - Province/État (obligatoire)
   * @param {string} user.postal_code - Code postal (obligatoire)
   * @param {string} user.date_of_birth - Date de naissance (obligatoire)
   * @param {string} user.ssn - Numéro de sécurité sociale (optionnel, peut être null)
   * @param {string} user.email - Adresse courriel (obligatoire, unique)
   * @param {string} user.password - Mot de passe hashé (obligatoire)
   * @returns {Promise<Object>} Résultat de l'insertion
   * @returns {number} return.lastID - ID du nouveau client créé
   * @returns {number} return.changes - Nombre de lignes modifiées
   * @throws {Error} Si la requête SQL échoue (notamment si email déjà existant)
   * 
   * @example
   * // Créer un nouveau client
   * const result = await ClientDAO.create({
   *   first_name: "Jean",
   *   last_name: "Dupont",
   *   address: "123 rue Principale",
   *   city: "Montréal",
   *   state: "QC",
   *   postal_code: "H1H 1H1",
   *   date_of_birth: "1990-01-01",
   *   ssn: "123-45-6789",
   *   email: "jean.dupont@email.com",
   *   password: "$2b$10$hashedpassword..."
   * });
   * console.log(`Client créé avec l'ID: ${result.lastID}`);
   */
  create(user) {
    return db.run(
      `INSERT INTO users
        (first_name, last_name, address, city, state, postal_code, date_of_birth, ssn, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'client')`,
      user.first_name,
      user.last_name,
      user.address,
      user.city,
      user.state,
      user.postal_code,
      user.date_of_birth,
      user.ssn ?? null,  // Si ssn est undefined, insérer NULL
      user.email,
      user.password
    );
  },

  /**
   * Met à jour les informations d'un client existant
   * @async
   * @param {number} id - ID du client à modifier
   * @param {Object} patch - Nouvelles données du client (tous les champs obligatoires)
   * @param {string} patch.first_name - Nouveau prénom
   * @param {string} patch.last_name - Nouveau nom
   * @param {string} patch.address - Nouvelle adresse
   * @param {string} patch.city - Nouvelle ville
   * @param {string} patch.state - Nouvelle province/état
   * @param {string} patch.postal_code - Nouveau code postal
   * @param {string} patch.date_of_birth - Nouvelle date de naissance
   * @param {string} patch.ssn - Nouveau NAS (peut être null)
   * @param {string} patch.email - Nouvel email
   * @returns {Promise<Object>} Résultat de la mise à jour
   * @returns {number} return.changes - Nombre de lignes modifiées (0 si client non trouvé)
   * @throws {Error} Si la requête SQL échoue
   * 
   * @example
   * // Mettre à jour l'adresse et le téléphone d'un client
   * const result = await ClientDAO.update(123, {
   *   first_name: "Jean",
   *   last_name: "Dupont",
   *   address: "456 Nouvelle Rue",
   *   city: "Montréal",
   *   state: "QC",
   *   postal_code: "H2H 2H2",
   *   date_of_birth: "1990-01-01",
   *   ssn: "123-45-6789",
   *   email: "jean.dupont@email.com"
   * });
   * 
   * if (result.changes === 0) {
   *   console.log("Client non trouvé");
   * } else {
   *   console.log("Client mis à jour avec succès");
   * }
   */
  update(id, patch) {
    return db.run(
      `UPDATE users SET
        first_name=?, last_name=?, address=?, city=?, state=?, postal_code=?, date_of_birth=?, ssn=?, email=?
       WHERE id=? AND role='client'`,
      patch.first_name,
      patch.last_name,
      patch.address,
      patch.city,
      patch.state,
      patch.postal_code,
      patch.date_of_birth,
      patch.ssn ?? null,  // Si ssn est undefined, mettre NULL
      patch.email,
      id
    );
  },

  /**
   * Supprime un client
   * @async
   * @param {number} id - ID du client à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   * @returns {number} return.changes - Nombre de lignes supprimées (0 si client non trouvé)
   * @throws {Error} Si la requête SQL échoue ou si des contraintes de clé étrangère sont violées
   * 
   * @example
   * // Supprimer le client avec l'ID 123
   * const result = await ClientDAO.remove(123);
   * 
   * if (result.changes === 0) {
   *   console.log("Client non trouvé");
   * } else {
   *   console.log("Client supprimé avec succès");
   * }
   * 
   * @note
   * La suppression peut échouer si le client a des comptes associés
   * (contrainte de clé étrangère). Il faut d'abord supprimer les comptes.
   */
  remove(id) {
    return db.run(`DELETE FROM users WHERE id=? AND role='client'`, id);
  },
};