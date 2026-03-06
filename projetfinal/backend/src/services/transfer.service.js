/**
 * Service de gestion des virements et paiements
 * @module services/transfer.service
 * @requires ../config/database
 * @requires ../models/bank.model
 * @requires ../models/transaction.model
 * @requires ../models/transfer.model
 * @requires ../models/user.model
 * @requires ../models/beneficiary.model
 */

import db from "../config/database.js";
import { AccountDAO } from "../models/bank.model.js";
import { TransactionDAO } from "../models/transaction.model.js";
import { TransferDAO } from "../models/transfer.model.js";
import { UserDAO } from "../models/user.model.js";
import { BeneficiaryDAO } from "../models/beneficiary.model.js";

/**
 * TransferService
 *
 * Couche logique métier (business logic).
 *
 * Responsabilités :
 * - Valider les données reçues du controller
 * - Vérifier la sécurité (ownership des comptes)
 * - Gérer les opérations bancaires
 * - Utiliser des transactions SQL atomiques
 * - Appeler les DAO pour lire/écrire en base
 */
export const TransferService = {

  /**
   * Virement interne entre deux comptes appartenant au même utilisateur
   *
   * @async
   * @function createInternalTransfer
   * @param {Object} payload
   * @param {number} payload.userId - ID du client connecté
   * @param {number} payload.fromAccountId - Compte source
   * @param {number} payload.toAccountId - Compte destination
   * @param {number} payload.amount - Montant du virement
   * @param {string} payload.date - Date du virement
   * @param {string} payload.frequency - Fréquence du virement
   * @param {string} [payload.description] - Description optionnelle
   * @returns {Promise<Object>} Résultat du virement
   *
   * @example
   * await TransferService.createInternalTransfer({
   *   userId: 5,
   *   fromAccountId: 1,
   *   toAccountId: 2,
   *   amount: 100,
   *   frequency: "once"
   * });
   */
  async createInternalTransfer(payload) {

    const {
      userId,
      fromAccountId,
      toAccountId,
      amount,
      date,
      frequency,
      description,
    } = payload;

    // Validation du montant
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, status: 400, error: "Montant invalide" };
    }

    // Vérifier présence des comptes
    if (!fromAccountId || !toAccountId) {
      return { ok: false, status: 400, error: "Comptes manquants" };
    }

    // Impossible de transférer vers le même compte
    if (fromAccountId === toAccountId) {
      return { ok: false, status: 400, error: "Comptes identiques" };
    }

    // Vérifier que les comptes appartiennent bien au client
    const from = await AccountDAO.findByIdAndClientId(fromAccountId, userId);
    const to = await AccountDAO.findByIdAndClientId(toAccountId, userId);

    if (!from) return { ok: false, status: 404, error: "Compte source introuvable" };
    if (!to) return { ok: false, status: 404, error: "Compte destination introuvable" };

    // Vérifier le solde disponible
    if (Number(from.balance) < amount) {
      return { ok: false, status: 400, error: "Solde insuffisant" };
    }

    try {

      // Début transaction SQL atomique
      await db.exec("BEGIN");

      const newFromBalance = Number(from.balance) - amount;
      const newToBalance = Number(to.balance) + amount;

      await AccountDAO.updateBalance(from.id, newFromBalance);
      await AccountDAO.updateBalance(to.id, newToBalance);

      // Enregistrement du transfert
      const transfer = await TransferDAO.create({
        fromAccountId: from.id,
        toAccountId: to.id,
        amount,
      });

      // Métadonnées facultatives
      const commonMeta = [];
      if (frequency) commonMeta.push(`freq=${frequency}`);
      const metaStr = commonMeta.length ? ` (${commonMeta.join(", ")})` : "";

      // Transaction débit
      const debit = await TransactionDAO.create({
        accountId: from.id,
        type: "DEBIT",
        amount,
        description: `Virement interne sortant${description ? `: ${description}` : ""}${metaStr}`,
      });

      // Transaction crédit
      const credit = await TransactionDAO.create({
        accountId: to.id,
        type: "CREDIT",
        amount,
        description: `Virement interne entrant${description ? `: ${description}` : ""}${metaStr}`,
      });

      await db.exec("COMMIT");

      return {
        ok: true,
        status: 201,
        data: {
          transfer,
          debit,
          credit,
          balances: {
            from: newFromBalance,
            to: newToBalance,
          },
        },
      };

    } catch (e) {

      await db.exec("ROLLBACK");

      return { ok: false, status: 500, error: "Erreur serveur pendant le virement" };
    }
  },

  /**
   * Virement Interac vers un autre client
   *
   * @async
   * @function createInteracTransfer
   * @param {Object} payload
   * @param {number} payload.userId - Client qui envoie
   * @param {number} payload.fromAccountId - Compte source
   * @param {number} payload.toClientId - Client destinataire
   * @param {number} payload.amount - Montant
   * @param {string} payload.description - Message optionnel
   * @param {string} payload.frequency - Fréquence
   */
  async createInteracTransfer(payload) {

    const { userId, fromAccountId, toClientId, amount, description, frequency } = payload;

    if (!userId) return { ok: false, status: 401, error: "Non authentifié" };

    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, status: 400, error: "Montant invalide" };
    }

    if (!fromAccountId || !toClientId) {
      return { ok: false, status: 400, error: "fromAccountId / toClientId manquants" };
    }

    const from = await AccountDAO.findByIdAndClientId(fromAccountId, userId);
    if (!from) return { ok: false, status: 404, error: "Compte source introuvable" };

    const to = await AccountDAO.findCheckingByClientId(toClientId);
    if (!to) return { ok: false, status: 404, error: "Compte courant du destinataire introuvable" };

    if (from.id === to.id) {
      return { ok: false, status: 400, error: "Impossible de transférer vers le même compte" };
    }

    if (Number(from.balance) < amount) {
      return { ok: false, status: 400, error: "Solde insuffisant" };
    }

    try {

      await db.exec("BEGIN");

      const receivedUser = await UserDAO.findById(toClientId);

      const newFromBalance = Number(from.balance) - amount;
      const newToBalance = Number(to.balance) + amount;

      await AccountDAO.updateBalance(from.id, newFromBalance);
      await AccountDAO.updateBalance(to.id, newToBalance);

      const transfer = await TransferDAO.create({
        fromAccountId: from.id,
        toAccountId: to.id,
        amount,
      });

      const desc = description ? `: ${String(description).trim()}` : "";

      const debit = await TransactionDAO.create({
        accountId: from.id,
        type: "DEBIT",
        amount,
        description: `Interac envoyé → ${receivedUser.first_name}${desc}`,
      });

      const credit = await TransactionDAO.create({
        accountId: to.id,
        type: "CREDIT",
        amount,
        description: `Interac reçu ← ${userId.first_name} ${desc}`,
      });

      await db.exec("COMMIT");

      return {
        ok: true,
        status: 201,
        data: {
          transfer,
          debit,
          credit,
          toAccountId: to.id,
          balances: { from: newFromBalance, to: newToBalance },
        },
      };

    } catch (e) {

      try {
        await db.exec("ROLLBACK");
      } catch (_) {}

      return {
        ok: false,
        status: 500,
        error: "Erreur serveur pendant le virement Interac",
        details: String(e?.message ?? e),
      };
    }
  },

  /**
   * Paiement d'une facture vers un bénéficiaire
   *
   * @async
   * @function payBill
   * @param {Object} payload
   * @param {number} payload.userId
   * @param {number} payload.fromAccountId
   * @param {number} payload.beneficiaryId
   * @param {number} payload.amount
   * @param {string} payload.date
   * @param {string} payload.frequency
   * @param {string} [payload.description]
   */
  async payBill(payload) {

    const {
      userId,
      fromAccountId,
      beneficiaryId,
      amount,
      date,
      frequency,
      description,
    } = payload;

    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, status: 400, error: "Montant invalide" };
    }

    if (!fromAccountId || !beneficiaryId) {
      return { ok: false, status: 400, error: "Champs manquants" };
    }

    const from = await AccountDAO.findByIdAndClientId(fromAccountId, userId);
    if (!from) return { ok: false, status: 404, error: "Compte source introuvable" };

    const beneficiary = await BeneficiaryDAO.findByIdAndUserId(beneficiaryId, userId);
    if (!beneficiary) return { ok: false, status: 404, error: "Bénéficiaire introuvable" };

    if (Number(from.balance) < amount) {
      return { ok: false, status: 400, error: "Solde insuffisant" };
    }

    try {

      await db.exec("BEGIN");

      const newFromBalance = Number(from.balance) - amount;
      await AccountDAO.updateBalance(from.id, newFromBalance);

      const debit = await TransactionDAO.create({
        accountId: from.id,
        type: "DEBIT",
        amount,
        description: `Paiement facture à ${beneficiary.name}${description ? `: ${description}` : ""}`,
      });

      await db.exec("COMMIT");

      return {
        ok: true,
        status: 201,
        data: {
          debit,
          beneficiary,
          balances: { from: newFromBalance },
        },
      };

    } catch (e) {

      await db.exec("ROLLBACK");

      return { ok: false, status: 500, error: "Erreur serveur pendant le paiement" };
    }
  }
};