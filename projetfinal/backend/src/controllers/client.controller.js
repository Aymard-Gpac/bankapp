/**
 * Contrôleur de gestion des clients
 * @module controllers/client.controller
 * @requires ../services/client.service
 */

import { ClientService } from "../services/client.service.js";

/**
 * Crée un nouveau client avec ses comptes bancaires par défaut
 * @async
 * @function createClient
 * @param {Object} req - Requête Express
 * @param {Object} req.body - Données du client à créer
 * @param {string} req.body.first_name - Prénom (obligatoire)
 * @param {string} req.body.last_name - Nom (obligatoire)
 * @param {string} req.body.email - Email (obligatoire, unique)
 * @param {string} [req.body.password] - Mot de passe (généré si absent)
 * @param {string} [req.body.address] - Adresse
 * @param {string} [req.body.city] - Ville
 * @param {string} [req.body.state] - Province
 * @param {string} [req.body.postal_code] - Code postal
 * @param {string} [req.body.date_of_birth] - Date de naissance
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP
 * 
 * @example
 * // Requête POST /api/clients
 * // Body: {
 * //   "first_name": "Jean",
 * //   "last_name": "Dupont",
 * //   "email": "jean@email.com",
 * //   "address": "123 rue Principale",
 * //   "city": "Montréal",
 * //   "state": "QC",
 * //   "postal_code": "H1H 1H1"
 * // }
 * 
 * // Réponse succès (201)
 * // {
 * //   "userId": 123,
 * //   "message": "Client created + 3 accounts created"
 * // }
 * 
 * // Réponse erreur (400)
 * // {
 * //   "error": "first_name, last_name, email are required"
 * // }
 */
export const createClient = async (req, res) => {
  const r = await ClientService.createClientWithDefaultAccounts(req.body);
  return res.status(r.status).json(r.ok ? r.data : { error: r.error });
};

/**
 * Liste tous les clients avec pagination
 * @async
 * @function listClients
 * @param {Object} req - Requête Express
 * @param {Object} req.query - Paramètres de pagination
 * @param {string} [req.query.limit=50] - Nombre maximum de résultats
 * @param {string} [req.query.offset=0] - Offset pour la pagination
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP
 * 
 * @example
 * // Requête GET /api/clients?limit=20&offset=40
 * 
 * // Réponse succès (200)
 * // [
 * //   { "id": 123, "first_name": "Jean", "last_name": "Dupont", "email": "jean@email.com" },
 * //   { "id": 124, "first_name": "Marie", "last_name": "Lambert", "email": "marie@email.com" }
 * // ]
 * 
 * @note
 * La limite est automatiquement plafonnée à 100 par le service
 */
export const listClients = async (req, res) => {
  const r = await ClientService.list(req.query);
  return res.status(r.status).json(r.ok ? r.data : { error: r.error });
};

/**
 * Récupère un client par son ID
 * @async
 * @function getClient
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route
 * @param {string} req.params.id - ID du client
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP
 * 
 * @example
 * // Requête GET /api/clients/123
 * 
 * // Réponse succès (200)
 * // {
 * //   "id": 123,
 * //   "first_name": "Jean",
 * //   "last_name": "Dupont",
 * //   "email": "jean@email.com",
 * //   "address": "123 rue Principale",
 * //   "city": "Montréal",
 * //   "state": "QC",
 * //   "postal_code": "H1H 1H1",
 * //   "date_of_birth": "1990-01-01",
 * //   "role": "client",
 * //   "created_at": "2024-01-01T00:00:00Z"
 * // }
 * 
 * // Réponse erreur (404)
 * // {
 * //   "error": "Client not found"
 * // }
 */
export const getClient = async (req, res) => {
  const id = Number(req.params.id);

  // Sécurité: un client ne peut lire QUE son propre profil
  if (req.user?.role === "client" && req.user.id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const r = await ClientService.get(id);
  return res.status(r.status).json(r.ok ? r.data : { error: r.error });
};

/**
 * Met à jour un client existant
 * @async
 * @function updateClient
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route
 * @param {string} req.params.id - ID du client à modifier
 * @param {Object} req.body - Nouvelles données (partielles)
 * @param {string} [req.body.first_name] - Nouveau prénom
 * @param {string} [req.body.last_name] - Nouveau nom
 * @param {string} [req.body.email] - Nouvel email
 * @param {string} [req.body.address] - Nouvelle adresse
 * @param {string} [req.body.city] - Nouvelle ville
 * @param {string} [req.body.state] - Nouvelle province
 * @param {string} [req.body.postal_code] - Nouveau code postal
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP
 * 
 * @example
 * // Requête PUT /api/clients/123
 * // Body: {
 * //   "first_name": "Jean-Pierre",
 * //   "address": "456 Nouvelle Rue"
 * // }
 * 
 * // Réponse succès (200)
 * // {
 * //   "message": "Updated"
 * // }
 * 
 * // Réponse erreur (409) - email déjà utilisé
 * // {
 * //   "error": "Email already used"
 * // }
 */
export const updateClient = async (req, res) => {
  const r = await ClientService.update(Number(req.params.id), req.body);
  return res.status(r.status).json(r.ok ? r.data : { error: r.error });
};

/**
 * Supprime un client
 * @async
 * @function deleteClient
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route
 * @param {string} req.params.id - ID du client à supprimer
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP
 * 
 * @example
 * // Requête DELETE /api/clients/123
 * 
 * // Réponse succès (200)
 * // {
 * //   "message": "Deleted"
 * // }
 * 
 * // Réponse erreur (404)
 * // {
 * //   "error": "Client not found"
 * // }
 * 
 * @note
 * La suppression peut échouer si le client a des comptes associés
 * (contrainte de clé étrangère) → erreur 500
 */
export const deleteClient = async (req, res) => {
  const r = await ClientService.remove(Number(req.params.id));
  return res.status(r.status).json(r.ok ? r.data : { error: r.error });
};

/**
 * Récupère le client courant (pour le contexte d'authentification)
 * @async
 * @function getCurrentClient
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route
 * @param {string} req.params.clientId - ID du client connecté
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant (gestion d'erreurs)
 * @returns {Promise<Object>} Réponse HTTP
 * 
 * @example
 * // Requête GET /api/clients/current/123
 * 
 * // Réponse succès (200)
 * // {
 * //   "id": 123,
 * //   "first_name": "Jean",
 * //   "last_name": "Dupont",
 * //   "email": "jean@email.com",
 * //   "role": "client",
 * //   ...autres données
 * // }
 * 
 * // Réponse erreur (400)
 * // {
 * //   "error": "Invalid clientId"
 * // }
 * 
 * // Réponse erreur (404) - via le service
 * // {
 * //   "error": "Client not found"
 * // }
 * 
 * @note
 * Cette méthode est similaire à getClient mais lance des erreurs
 * pour être cohérente avec le style des services d'authentification
 */
export const getCurrentClient = async (req, res, next) => {
    try {
      // Validation du paramètre clientId
      const clientId = Number(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ error: "Invalid clientId" });
      }

      // Appel au service (peut lancer une erreur)
      const client = await ClientService.getCurrentClient(clientId);
      res.json(client);
    } catch (err) {
      // Passer l'erreur au middleware de gestion d'erreurs
      next(err);
    }
  };