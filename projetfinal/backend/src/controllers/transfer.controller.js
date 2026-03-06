
import { TransferService } from "../services/transfer.service.js";

/**
 * Objet contrôleur regroupant les méthodes de transfert
 */
export const TransferController = {

  /**
   * Crée un transfert Interac entre deux clients
   * @async
   * @function createInteracTransfer
   * @param {Object} req - Requête Express
   * @param {Object} req.user - Utilisateur authentifié
   * @param {number} req.user.id - ID du client connecté
   * @param {Object} req.body - Données du transfert
   * @param {number|string} req.body.fromAccountId - Compte source
   * @param {number|string} req.body.toClientId - Client destinataire
   * @param {number|string} req.body.amount - Montant à transférer
   * @param {string} [req.body.description] - Message optionnel
   * @param {Object} res - Réponse Express
   * @returns {Promise<Object>} Réponse HTTP
   *
   * @example
   * // Requête POST /api/transfers/interac
   * // Body:
   * // {
   * //   "fromAccountId": 1,
   * //   "toClientId": 12,
   * //   "amount": 100,
   * //   "description": "Loyer"
   * // }
   *
   * // Réponse succès (201)
   * // {
   * //   "transactionId": 55,
   * //   "message": "Interac transfer successful"
   * // }
   */
  async createInteracTransfer(req, res) {

    // Construction du payload à envoyer au service
    const payload = {
      userId: req.user?.id,
      fromAccountId: req.body.fromAccountId ?? req.body.from_account_id,
      toClientId: req.body.toClientId ?? req.body.to_client_id,
      amount: Number(req.body.amount),
      description: req.body.description,
    };

    // Appel au service métier
    const r = await TransferService.createInteracTransfer(payload);

    // Retour de la réponse HTTP
    return res
      .status(r.status)
      .json(r.ok ? r.data : { error: r.error, details: r.details });
  },

  /**
   * Crée un transfert interne entre deux comptes appartenant au client
   * @async
   * @function createInternalTransfer
   * @param {Object} req - Requête Express
   * @param {Object} req.user - Utilisateur authentifié
   * @param {number} req.user.id - ID du client connecté
   * @param {Object} req.body - Données du transfert
   * @param {number|string} req.body.fromAccountId - Compte source
   * @param {number|string} req.body.toAccountId - Compte destinataire
   * @param {number|string} req.body.amount - Montant du transfert
   * @param {string} [req.body.date] - Date du transfert
   * @param {string} [req.body.frequency] - Fréquence (ex: once, monthly)
   * @param {string} [req.body.description] - Description optionnelle
   * @param {Object} res - Réponse Express
   * @returns {Promise<Object>} Réponse HTTP
   *
   * @example
   * // POST /api/transfers/internal
   * // Body:
   * // {
   * //   "fromAccountId": 1,
   * //   "toAccountId": 2,
   * //   "amount": 200
   * // }
   */
  async createInternalTransfer(req, res) {

    const { fromAccountId, toAccountId, amount, date, frequency, description } =
      req.body;

    // Appel au service métier
    const result = await TransferService.createInternalTransfer({
      userId: req.user.id,
      fromAccountId: Number(fromAccountId),
      toAccountId: Number(toAccountId),
      amount: Number(amount),
      date,
      frequency,
      description,
    });

    // Réponse HTTP
    return res
      .status(result.status)
      .json(result.ok ? { data: result.data } : { error: result.error });
  },
};

/**
 * Effectue le paiement d'une facture vers un bénéficiaire
 * @async
 * @function payBill
 * @param {Object} req - Requête Express
 * @param {Object} req.user - Utilisateur authentifié
 * @param {number} req.user.id - ID du client connecté
 * @param {Object} req.body - Données du paiement
 * @param {number|string} req.body.fromAccountId - Compte source
 * @param {number|string} req.body.beneficiaryId - Bénéficiaire à payer
 * @param {number|string} req.body.amount - Montant du paiement
 * @param {string} [req.body.date] - Date prévue du paiement
 * @param {string} [req.body.frequency] - Fréquence (ex: once)
 * @param {string} [req.body.description] - Description optionnelle
 * @param {Object} res - Réponse Express
 * @returns {Promise<Object>} Réponse HTTP
 *
 * @example
 * // POST /api/transfers/bill
 * // Body:
 * // {
 * //   "fromAccountId": 1,
 * //   "beneficiaryId": 5,
 * //   "amount": 45,
 * //   "description": "Internet"
 * // }
 *
 * // Réponse succès (201)
 * // {
 * //   "data": {
 * //     "transactionId": 88,
 * //     "message": "Bill paid successfully"
 * //   }
 * // }
 */
export const payBill = async (req, res) => {

  const { fromAccountId, beneficiaryId, amount, date, frequency, description } =
    req.body;

  // Appel au service métier
  const result = await TransferService.payBill({
    userId: req.user.id,
    fromAccountId: Number(fromAccountId),
    beneficiaryId: Number(beneficiaryId),
    amount: Number(amount),
    date,
    frequency,
    description,
  });

  // Réponse HTTP
  return res
    .status(result.status)
    .json(result.ok ? { data: result.data } : { error: result.error });
};