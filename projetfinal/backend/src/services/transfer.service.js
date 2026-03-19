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

/**
 * Convertit une date "YYYY-MM-DD" provenant du frontend
 * en format DATETIME SQLite "YYYY-MM-DD HH:mm:ss".
 * Si la date est absente ou invalide, on prend maintenant.
 */
function normalizeSqlDate(date) {
  const now = new Date();

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return `${date.trim()} ${hh}:${mm}:${ss}`;
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
}

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
    // Normalisation de la date pour SQLite
    const createdAt = normalizeSqlDate(date);

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
        createdAt,
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
        createdAt,
      });

      // Transaction crédit
      const credit = await TransactionDAO.create({
        accountId: to.id,
        type: "CREDIT",
        amount,
        description: `Virement interne entrant${description ? `: ${description}` : ""}${metaStr}`,
        createdAt,    
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
  const {
    userId,
    fromAccountId,
    recipientEmail,
    recipientFirstName,
    recipientLastName,
    amount,
    date,
    description,
    frequency,
    isExternalRecipient,
  } = payload;

  const createdAt = normalizeSqlDate(date);
  const cleanEmail = String(recipientEmail ?? "").trim().toLowerCase();
  const cleanFirstName = String(recipientFirstName ?? "").trim();
  const cleanLastName = String(recipientLastName ?? "").trim();

  if (!userId) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, status: 400, error: "Montant invalide" };
  }

  if (!fromAccountId || !cleanEmail) {
    return {
      ok: false,
      status: 400,
      error: "fromAccountId / recipientEmail manquants",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      ok: false,
      status: 400,
      error: "Adresse email invalide",
    };
  }

  if (isExternalRecipient) {
    if (!cleanFirstName) {
      return {
        ok: false,
        status: 400,
        error: "Le prénom du destinataire externe est obligatoire",
      };
    }

    if (!cleanLastName) {
      return {
        ok: false,
        status: 400,
        error: "Le nom du destinataire externe est obligatoire",
      };
    }
  }

  const from = await AccountDAO.findByIdAndClientId(fromAccountId, userId);
  if (!from) {
    return { ok: false, status: 404, error: "Compte source introuvable" };
  }

  if (Number(from.balance) < amount) {
    return { ok: false, status: 400, error: "Solde insuffisant" };
  }

  try {
    await db.exec("BEGIN");

    let transfer;
    let credit = null;
    let recipient = null;
    const newFromBalance = Number(from.balance) - amount;

    await AccountDAO.updateBalance(from.id, newFromBalance);

    if (isExternalRecipient) {
      // Cas simulation externe :
      // on débite seulement le compte source
      // on crée quand même une trace technique dans transfers
      transfer = await TransferDAO.create({
        fromAccountId: from.id,
        toAccountId: from.id,
        amount,
        createdAt,
      });

      recipient = {
        first_name: cleanFirstName,
        last_name: cleanLastName,
        email: cleanEmail,
        external: true,
      };
    } else {
      // Cas client existant choisi dans la liste : comportement normal
      const recipientUser = await UserDAO.findByEmail(cleanEmail);

      if (!recipientUser) {
        await db.exec("ROLLBACK");
        return {
          ok: false,
          status: 404,
          error: "Aucun client trouvé avec cet email",
        };
      }

      if (recipientUser.role !== "client") {
        await db.exec("ROLLBACK");
        return {
          ok: false,
          status: 400,
          error: "Le destinataire doit être un client",
        };
      }

      if (recipientUser.id === userId) {
        await db.exec("ROLLBACK");
        return {
          ok: false,
          status: 400,
          error: "Impossible d’envoyer un Interac à vous-même",
        };
      }

      const to = await AccountDAO.findCheckingByClientId(recipientUser.id);
      if (!to) {
        await db.exec("ROLLBACK");
        return {
          ok: false,
          status: 404,
          error: "Compte chèque du destinataire introuvable",
        };
      }

      const newToBalance = Number(to.balance) + amount;

      await AccountDAO.updateBalance(to.id, newToBalance);

      transfer = await TransferDAO.create({
        fromAccountId: from.id,
        toAccountId: to.id,
        amount,
        createdAt,
      });

      const senderUser = await UserDAO.findById(userId);
      const desc = description ? `: ${String(description).trim()}` : "";
      const metaStr = frequency ? ` (freq=${frequency})` : "";

      credit = await TransactionDAO.create({
        accountId: to.id,
        type: "CREDIT",
        amount,
        description: `Interac reçu de ${senderUser.email}${desc}${metaStr}`,
        createdAt,
      });

      recipient = {
        id: recipientUser.id,
        first_name: recipientUser.first_name,
        last_name: recipientUser.last_name,
        email: recipientUser.email,
        external: false,
      };
    }

    const desc = description ? `: ${String(description).trim()}` : "";
    const metaStr = frequency ? ` (freq=${frequency})` : "";

    const recipientDisplayName = isExternalRecipient
      ? `${cleanFirstName} ${cleanLastName}`.trim()
      : `${recipient?.first_name ?? ""} ${recipient?.last_name ?? ""}`.trim();

    const debit = await TransactionDAO.create({
      accountId: from.id,
      type: "DEBIT",
      amount,
      description: recipientDisplayName
        ? `Interac envoyé à ${recipientDisplayName}${desc}${metaStr}`
        : `Interac envoyé${desc}${metaStr}`,
      createdAt,
});

    await db.exec("COMMIT");

    return {
      ok: true,
      status: 201,
      data: {
        transfer,
        debit,
        credit,
        recipient,
        balances: {
          from: newFromBalance,
        },
      },
    };
  } catch (e) {
    await db.exec("ROLLBACK");

    return {
      ok: false,
      status: 500,
      error: "Erreur serveur pendant le virement Interac",
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

    const createdAt = normalizeSqlDate(date);

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

      const metaStr = frequency ? ` (freq=${frequency})` : "";

      const debit = await TransactionDAO.create({
        accountId: from.id,
        type: "DEBIT",
        amount,
        description: `Paiement facture à ${beneficiary.name}${description ? `: ${description}` : ""}${metaStr}`,
        createdAt,
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

      return {
        ok: false,
        status: 500,
        error: "Erreur serveur pendant le paiement",
      };
    }
  }
};